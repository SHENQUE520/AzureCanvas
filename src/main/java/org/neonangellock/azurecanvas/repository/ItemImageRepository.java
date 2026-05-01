package org.neonangellock.azurecanvas.repository;

import org.neonangellock.azurecanvas.model.ItemImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface ItemImageRepository extends JpaRepository<ItemImage, UUID> {
}
