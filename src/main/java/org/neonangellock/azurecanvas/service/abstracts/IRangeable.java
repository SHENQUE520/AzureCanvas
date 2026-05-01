package org.neonangellock.azurecanvas.service.abstracts;

import java.util.List;

public interface IRangeable<T> {
    List<T> findAllWithRange(int page, int limit);
}
