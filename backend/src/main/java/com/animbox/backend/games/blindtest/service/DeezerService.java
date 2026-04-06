package com.animbox.backend.games.blindtest.service;

import com.animbox.backend.games.blindtest.dto.DeezerSearchResultDTO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class DeezerService {

    private static final Logger log = LoggerFactory.getLogger(DeezerService.class);
    private static final String BASE = "https://api.deezer.com";

    private final RestTemplate restTemplate = new RestTemplate();
    private final Map<Long, String> previewCache = new ConcurrentHashMap<>();

    public Optional<String> getPreviewUrl(Long deezerTrackId) {
        if (deezerTrackId == null) return Optional.empty();
        if (previewCache.containsKey(deezerTrackId)) {
            return Optional.ofNullable(previewCache.get(deezerTrackId));
        }
        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> response = restTemplate.getForObject(BASE + "/track/" + deezerTrackId, Map.class);
            if (response != null && response.get("preview") instanceof String preview && !preview.isBlank()) {
                previewCache.put(deezerTrackId, preview);
                return Optional.of(preview);
            }
        } catch (Exception e) {
            log.warn("Deezer track lookup failed for id={}: {}", deezerTrackId, e.getMessage());
        }
        return Optional.empty();
    }

    @SuppressWarnings("unchecked")
    public List<DeezerSearchResultDTO> search(String query) {
        try {
            String encoded = URLEncoder.encode(query, StandardCharsets.UTF_8);
            Map<String, Object> response = restTemplate.getForObject(
                    BASE + "/search?q=" + encoded + "&limit=10&output=json", Map.class);
            if (response == null || !(response.get("data") instanceof List<?> data)) return List.of();

            List<DeezerSearchResultDTO> results = new ArrayList<>();
            for (Object item : data) {
                if (!(item instanceof Map<?, ?> track)) continue;
                Long id = toLong(track.get("id"));
                String title = (String) track.get("title");
                String preview = (String) track.get("preview");
                Object artistObj = track.get("artist");
                String artist = (artistObj instanceof Map<?, ?> a) ? (String) a.get("name") : "";
                if (id != null && title != null && preview != null && !preview.isBlank()) {
                    results.add(new DeezerSearchResultDTO(id, title, artist, preview));
                    previewCache.put(id, preview);
                }
            }
            return results;
        } catch (Exception e) {
            log.warn("Deezer search failed for query='{}': {}", query, e.getMessage());
            return List.of();
        }
    }

    private Long toLong(Object obj) {
        if (obj instanceof Number n) return n.longValue();
        if (obj instanceof String s) { try { return Long.parseLong(s); } catch (NumberFormatException ignored) {} }
        return null;
    }
}
