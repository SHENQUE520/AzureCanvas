package org.neonangellock.azurecanvas.model.es;

import lombok.Getter;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.elasticsearch.annotations.Document;
import org.springframework.data.elasticsearch.annotations.Field;
import org.springframework.data.elasticsearch.annotations.FieldType;

import java.math.BigDecimal;

@Document(indexName = "items")
@Getter
@Setter
public class EsItem {

    @Id
    private String id;
    @Field(type = FieldType.Text, analyzer = "english")
    private String titleEn;

    @Field(type = FieldType.Text, analyzer = "english")
    private String descriptionEn;

    @Field(type = FieldType.Text, analyzer = "ik_max_word", searchAnalyzer = "ik_smart")
    private String titleZh;

    @Field(type = FieldType.Text, analyzer = "ik_max_word", searchAnalyzer = "ik_smart")
    private String descriptionZh;
    @Field(type = FieldType.Text, analyzer = "ik_max_word", searchAnalyzer = "ik_smart")
    private String title;

    @Field(type = FieldType.Text, analyzer = "ik_max_word", searchAnalyzer = "ik_smart")
    private String description;

    @Field(type = FieldType.Double)
    private BigDecimal price;

    @Field(type = FieldType.Keyword)
    private String category;

    @Field(type = FieldType.Keyword)
    private String status;

    @Field(type = FieldType.Text, analyzer = "ik_max_word")
    private String location;

    @Field(type = FieldType.Integer)
    private Integer views;

    @Field(type = FieldType.Byte)
    private Byte quality;

    @Field(type = FieldType.Boolean)
    private boolean isUrgent;

    @Field(type = FieldType.Boolean)
    private boolean isFreeShipping;

    @Field(type = FieldType.Boolean)
    private boolean canInspect;

    @Field(type = FieldType.Date)
    private String createdAt;

    // Getters and Setters
    public void setFreeShipping(boolean freeShipping) {
        isFreeShipping = freeShipping;
    }
}
