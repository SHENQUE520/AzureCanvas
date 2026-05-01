package org.neonangellock.azurecanvas.model.es;

import org.springframework.data.annotation.Id;
import org.springframework.data.elasticsearch.annotations.Document;
import org.springframework.data.elasticsearch.annotations.Field;
import org.springframework.data.elasticsearch.annotations.FieldType;

import java.math.BigDecimal;

@Document(indexName = "items")
public class EsItem {

    @Id
    private String id;

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
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public BigDecimal getPrice() { return price; }
    public void setPrice(BigDecimal price) { this.price = price; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }
    public Integer getViews() { return views; }
    public void setViews(Integer views) { this.views = views; }
    public Byte getQuality() { return quality; }
    public void setQuality(Byte quality) { this.quality = quality; }
    public boolean isUrgent() { return isUrgent; }
    public void setUrgent(boolean urgent) { isUrgent = urgent; }
    public boolean isFreeShipping() { return isFreeShipping; }

    public boolean isCanInspect() { return canInspect; }
    public void setCanInspect(boolean canInspect) { this.canInspect = canInspect; }
    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }

    public void setFreeShipping(boolean freeShipping) {
        isFreeShipping = freeShipping;
    }
}
