package org.neonangellock.azurecanvas.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Sinks;
import reactor.core.scheduler.Schedulers;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
public class DeepSeekService {

    @Value("${deepseek.api.url}")
    private String apiUrl;

    @Value("${deepseek.api.key}")
    private String apiKey;

    @Value("${deepseek.model:deepseek-chat}")
    private String model;

    public Flux<String> chatCompletionStream(List<Map<String, String>> messages) {
        log.info("正在调用 DeepSeek API (流式)，消息数量：{}", messages.size());

        Sinks.Many<String> sink = Sinks.many().unicast().onBackpressureBuffer();

        // 在后台线程中执行 HTTP 请求
        Schedulers.boundedElastic().schedule(() -> {
            HttpURLConnection connection = null;
            try {
                URL url = new URL(apiUrl);
                connection = (HttpURLConnection) url.openConnection();
                connection.setRequestMethod("POST");
                connection.setRequestProperty("Content-Type", "application/json");
                connection.setRequestProperty("Authorization", "Bearer " + apiKey);
                connection.setRequestProperty("Accept", "text/event-stream");
                connection.setDoOutput(true);
                connection.setDoInput(true);
                connection.setConnectTimeout(30000);
                connection.setReadTimeout(120000);
                connection.setChunkedStreamingMode(0);

                String requestBody = buildRequestBody(messages);
                log.debug("请求体: {}", requestBody);

                try (var os = connection.getOutputStream()) {
                    os.write(requestBody.getBytes(StandardCharsets.UTF_8));
                }

                int responseCode = connection.getResponseCode();
                log.info("DeepSeek API 响应码: {}", responseCode);

                if (responseCode != 200) {
                    String errorBody = "";
                    try (var reader = new BufferedReader(new InputStreamReader(connection.getErrorStream(), StandardCharsets.UTF_8))) {
                        errorBody = reader.lines().collect(Collectors.joining("\n"));
                    }
                    log.error("DeepSeek API 错误响应: {}", errorBody);
                    sink.tryEmitNext("{\"error\": \"HTTP " + responseCode + "\n" + errorBody + "\"}");
                    sink.tryEmitComplete();
                    return;
                }

                try (var reader = new BufferedReader(new InputStreamReader(connection.getInputStream(), StandardCharsets.UTF_8))) {
                    String line;
                    int lineCount = 0;
                    while ((line = reader.readLine()) != null) {
                        lineCount++;
                        log.debug("原始行 #{}: [{}]", lineCount, line);

                        if (line.trim().isEmpty()) continue;

                        if (line.startsWith("data: ")) {
                            String data = line.substring(6).trim();
                            log.debug("提取数据: [{}]", data);

                            if (data.equals("[DONE]")) {
                                log.info("🏁 收到 [DONE] 结束标记");
                                sink.tryEmitNext("[DONE]");
                                break;
                            }

                            if (!data.isEmpty()) {
                                log.info("✅ 发送数据到前端: {}...", data.length() > 80 ? data.substring(0, 80) : data);
                                Sinks.EmitResult result = sink.tryEmitNext(data);
                                if (result.isFailure()) {
                                    log.warn("发送数据失败: {}", result);
                                }
                            }
                        }
                    }
                    log.info("✅ 读取完成，共 {} 行", lineCount);
                }

                sink.tryEmitComplete();

            } catch (Exception e) {
                log.error("❌ DeepSeek API call exception: {}", e.getMessage(), e);
                sink.tryEmitNext("{\"error\": \"DeepSeek API error: " + e.getMessage() + "\"}");
                sink.tryEmitComplete();
            } finally {
                if (connection != null) {
                    connection.disconnect();
                }
            }
        });

        return sink.asFlux()
                .timeout(Duration.ofSeconds(120))
                .doOnError(error -> log.error("❌ Flux 错误: {}", error.getMessage()))
                .onErrorResume(error -> {
                    log.error("❌ 流处理错误: {}", error.getMessage());
                    return Flux.just("{\"error\": \"流处理错误: " + error.getMessage() + "\"}");
                });
    }

    private String buildRequestBody(List<Map<String, String>> messages) {
        StringBuilder sb = new StringBuilder();
        sb.append("{");
        sb.append("\"model\":\"").append(model).append("\",");
        sb.append("\"messages\":[");

        for (int i = 0; i < messages.size(); i++) {
            Map<String, String> msg = messages.get(i);
            if (i > 0) sb.append(",");
            sb.append("{");
            sb.append("\"role\":\"").append(escapeJson(msg.get("role"))).append("\",");
            sb.append("\"content\":\"").append(escapeJson(msg.get("content"))).append("\"");
            sb.append("}");
        }

        sb.append("],");
        sb.append("\"stream\":true,");
        sb.append("\"temperature\":0.7,");
        sb.append("\"max_tokens\":2048");
        sb.append("}");

        return sb.toString();
    }

    private String escapeJson(String input) {
        if (input == null) return "";
        return input.replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "\\r")
                .replace("\t", "\\t");
    }

    public List<Map<String, String>> buildMessages(String systemPrompt, String userMessage) {
        return List.of(
                Map.of("role", "system", "content", systemPrompt),
                Map.of("role", "user", "content", userMessage)
        );
    }
}
