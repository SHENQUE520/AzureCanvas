package org.neonangellock.azurecanvas.model.es;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.elasticsearch.annotations.Document;
import org.springframework.data.elasticsearch.annotations.Field;
import org.springframework.data.elasticsearch.annotations.FieldType;

@Data
@Document(indexName = "storymap")
public class EsStoryMap {

    @Id
    private String storyMapId;

    @Field(type = FieldType.Text, analyzer = "ik_max_word", searchAnalyzer = "ik_smart")
    private String title;

    @Field(type = FieldType.Text, analyzer = "ik_max_word", searchAnalyzer = "ik_smart")
    private String description;
    @Field(type = FieldType.Text, analyzer = "english")
    private String titleEn;

    @Field(type = FieldType.Text, analyzer = "english")
    private String descriptionEn;

    @Field(type = FieldType.Text, analyzer = "english")
    private String locationEn;

    @Field(type = FieldType.Text, analyzer = "ik_max_word", searchAnalyzer = "ik_smart")
    private String titleZh;

    @Field(type = FieldType.Text, analyzer = "ik_max_word", searchAnalyzer = "ik_smart")
    private String descriptionZh;

    @Field(type = FieldType.Text, analyzer = "ik_max_word", searchAnalyzer = "ik_smart")
    private String locationZh;

    @Field(type = FieldType.Keyword)
    private String category;

    @Field(type = FieldType.Text, analyzer = "ik_max_word", searchAnalyzer = "ik_smart")
    private String location;

    @Field(type = FieldType.Double)
    private Double lat;

    @Field(type = FieldType.Double)
    private Double lng;

    @Field(type = FieldType.Integer)
    private Integer likes;

    @Field(type = FieldType.Integer)
    private Integer comments;

    @Field(type = FieldType.Keyword)
    private String authorID;

    @Field(type = FieldType.Text)
    private String author;

    @Field(type = FieldType.Text)
    private String createdAt;

    @Field(type = FieldType.Text)
    private String updatedAt;
}
