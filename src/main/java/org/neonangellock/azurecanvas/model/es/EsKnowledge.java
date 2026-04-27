package org.neonangellock.azurecanvas.model.es;

import lombok.Getter;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.elasticsearch.annotations.Document;
import org.springframework.data.elasticsearch.annotations.Field;
import org.springframework.data.elasticsearch.annotations.FieldType;

@Setter
@Getter
@Document(indexName = "knowledge_base")
public class EsKnowledge {
    // getter + setter
    @Id
    private String id;

    @Field(type = FieldType.Text)
    private String title;

    @Field(type = FieldType.Text)
    private String content;

    public EsKnowledge() {
    }

    public EsKnowledge(String title, String content) {
        this.title = title;
        this.content = content;
    }

}