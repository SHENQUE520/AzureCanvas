package org.neonangellock.azurecanvas.util;

import java.util.ArrayList;
import java.util.List;
import java.util.Random;

public class ContentGenerator {
    private static final Random random = new Random();

    // 生成帖子标题
    public static String generatePostTitle(String topic) {
        List<String> titles = getTitlesForTopic(topic);
        return titles.get(random.nextInt(titles.size()));
    }

    // 生成帖子内容
    public static String generatePostContent(String topic, String title) {
        List<String> contents = getContentsForTopic(topic);
        return contents.get(random.nextInt(contents.size()));
    }

    // 生成回复内容
    public static String generateReply() {
        List<String> replies = getReplies();
        return replies.get(random.nextInt(replies.size()));
    }

    // 根据话题获取标题列表
    private static List<String> getTitlesForTopic(String topic) {
        List<String> titles = new ArrayList<>();
        
        if (topic.contains("校园生活")) {
            titles.add("今天在图书馆遇到了一件有趣的事");
            titles.add("校园里的花开了，太美了");
            titles.add("分享一下我的校园生活日常");
            titles.add("期末考试复习心得分享");
            titles.add("校园活动推荐：这个周末有什么好玩的？");
        }
        
        if (topic.contains("学习交流")) {
            titles.add("【分享】高效学习方法");
            titles.add("这门课的难点解析");
            titles.add("考试前的准备工作");
            titles.add("学习资源推荐");
            titles.add("如何平衡学习和课外活动？");
        }
        
        if (topic.contains("兴趣爱好")) {
            titles.add("【分享】我的摄影作品");
            titles.add("最近迷上了编程，大家有什么建议？");
            titles.add("推荐一些好看的电影");
            titles.add("健身爱好者集合！");
            titles.add("分享我的绘画作品");
        }
        
        if (topic.contains("二手交易")) {
            titles.add("出售二手 textbooks，几乎全新");
            titles.add("转让一张健身卡");
            titles.add("出闲置物品，价格可议");
            titles.add("求购二手自行车");
            titles.add("出售九成新电子产品");
        }
        
        if (topic.contains("求助问答")) {
            titles.add("请问哪里可以打印文件？");
            titles.add("有人知道这个问题怎么解决吗？");
            titles.add("求助：电脑突然开不了机");
            titles.add("请问图书馆的开放时间是？");
            titles.add("求助：寻找丢失的校园卡");
        }
        
        // 默认标题
        if (titles.isEmpty()) {
            titles.add("分享一些想法");
            titles.add("大家好，来聊聊");
            titles.add("最近的一些感悟");
            titles.add("有个问题想请教大家");
            titles.add("分享一个好消息");
        }
        
        return titles;
    }

    // 根据话题获取内容列表
    private static List<String> getContentsForTopic(String topic) {
        List<String> contents = new ArrayList<>();
        
        if (topic.contains("校园生活")) {
            contents.add("今天在校园里看到了很美的日落，分享给大家。校园生活真的很美好，希望大家都能珍惜这段时光。");
            contents.add("最近校园里的活动很多，大家都参加了哪些？感觉收获满满！");
            contents.add("分享一下我的校园日常，每天都很充实，虽然有时候会有点累，但很开心。");
            contents.add("校园的食堂最近推出了新菜品，大家可以去尝试一下，味道还不错！");
            contents.add("今天在图书馆学习了一整天，效率很高，推荐大家也去图书馆学习。");
        }
        
        if (topic.contains("学习交流")) {
            contents.add("最近在学习这门课程，感觉有些难度，分享一下我的学习方法，希望对大家有帮助。");
            contents.add("考试即将来临，大家都准备得怎么样了？分享一些复习技巧。");
            contents.add("这门课的知识点很多，整理了一些重点，分享给大家。");
            contents.add("推荐一些学习资源，对这门课很有帮助。");
            contents.add("学习过程中遇到了一些问题，大家有什么好的解决方法吗？");
        }
        
        if (topic.contains("兴趣爱好")) {
            contents.add("最近开始学习摄影，拍了一些作品，分享给大家，希望大家喜欢。");
            contents.add("最近迷上了编程，做了一些小项目，分享一下我的学习心得。");
            contents.add("推荐一些最近看的好电影，剧情很精彩，推荐大家去看。");
            contents.add("最近开始健身，感觉身体状态好了很多，推荐大家也开始运动。");
            contents.add("分享一下我的绘画作品，虽然不是很专业，但自己很喜欢。");
        }
        
        if (topic.contains("二手交易")) {
            contents.add("因为要毕业了，出售一些二手物品，价格实惠，有需要的同学可以联系我。");
            contents.add("转让一张健身卡，还有半年有效期，价格可议。");
            contents.add("出一些闲置物品，几乎全新，有需要的同学可以看看。");
            contents.add("求购一辆二手自行车，价格合理，有出售的同学可以联系我。");
            contents.add("出售一些电子产品，九成新，功能完好，价格优惠。");
        }
        
        if (topic.contains("求助问答")) {
            contents.add("请问学校附近哪里可以打印文件？价格实惠的那种。");
            contents.add("遇到了一个技术问题，大家有什么好的解决方法吗？");
            contents.add("电脑突然开不了机，有人知道是什么原因吗？");
            contents.add("请问图书馆的开放时间是几点到几点？周末开吗？");
            contents.add("今天在校园里丢失了校园卡，有捡到的同学可以联系我，谢谢！");
        }
        
        // 默认内容
        if (contents.isEmpty()) {
            contents.add("大家好，今天想和大家分享一些想法。");
            contents.add("最近发生了一些有趣的事情，想和大家聊聊。");
            contents.add("有个问题想请教大家，希望能得到一些建议。");
            contents.add("分享一个最近的感悟，希望对大家有帮助。");
            contents.add("今天天气不错，心情也很好，来和大家打个招呼。");
        }
        
        return contents;
    }

    // 获取回复列表
    private static List<String> getReplies() {
        List<String> replies = new ArrayList<>();
        replies.add("说得很有道理，赞同！");
        replies.add("学习了，谢谢分享！");
        replies.add("我也有类似的经历，确实是这样。");
        replies.add("请问具体是怎么操作的呢？");
        replies.add("感谢分享，对我很有帮助！");
        replies.add("这个问题我也遇到过，后来解决了。");
        replies.add("期待更多分享！");
        replies.add("说得太对了，支持！");
        replies.add("有道理，学习了。");
        replies.add("谢谢分享，受益匪浅！");
        return replies;
    }
}
