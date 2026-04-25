package org.neonangellock.azurecanvas.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.io.Serializable;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "item_favorite")
@Getter
@Setter
public class ItemFavorite {
    @EmbeddedId
    private ItemFavorite.ItemFavoriteId id;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("itemId")
    @JoinColumn(name = "itemId")
    private Item item;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("userId")
    @JoinColumn(name = "userId")
    private User liker;

    @CreationTimestamp
    @Column(name = "likedAt", nullable = false, updatable = false)
    private OffsetDateTime likedAt;

    @Embeddable
    @Getter @Setter
    public static class ItemFavoriteId implements Serializable {
        private UUID userId;
        private UUID item;

        public ItemFavoriteId() {}
        public ItemFavoriteId(UUID followerId, UUID followingId) {
            this.item = followerId;
            this.userId = followingId;
        }

        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;
            ItemFavorite.ItemFavoriteId that = (ItemFavorite.ItemFavoriteId) o;
            return item.equals(that.item) && userId.equals(that.userId);
        }

        @Override
        public int hashCode() {
            return 31 * userId.hashCode() + item.hashCode();
        }
    }
}
