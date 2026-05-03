package org.neonangellock.azurecanvas.repository;

import org.neonangellock.azurecanvas.model.TreeholeImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface TreeholeImageRepository extends JpaRepository<TreeholeImage, UUID> {
}
