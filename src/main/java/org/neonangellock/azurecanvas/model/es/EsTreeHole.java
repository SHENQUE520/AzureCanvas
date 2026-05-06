package org.neonangellock.azurecanvas.model.es;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.elasticsearch.annotations.Document;
import org.springframework.data.elasticsearch.annotations.Field;
import org.springframework.data.elasticsearch.annotations.FieldType;

@Document(indexName = "treehole")
@Data
public class EsTreeHole {

    @Id
    private String id;
    @Field(type = FieldType.Text, analyzer = "english")
    private String titleEn;

    @Field(type = FieldType.Text, analyzer = "english")
    private String contentEn;

    @Field(type = FieldType.Text, analyzer = "ik_max_word", searchAnalyzer = "ik_smart")
    private String titleZh;

    @Field(type = FieldType.Text, analyzer = "ik_max_word", searchAnalyzer = "ik_smart")
    private String contentZh;

    @Field(type = FieldType.Keyword)
    private String boardName;

    @Field(type = FieldType.Text, analyzer = "ik_max_word", searchAnalyzer = "ik_smart")
    private String title;

    @Field(type = FieldType.Text, analyzer = "ik_max_word", searchAnalyzer = "ik_smart")
    private String content;
}
