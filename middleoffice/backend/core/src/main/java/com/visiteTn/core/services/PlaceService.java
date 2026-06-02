package com.visiteTn.core.services;

import com.visiteTn.core.Repositories.PlaceRepository;
import com.visiteTn.core.entities.Place;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class PlaceService {

    private final PlaceRepository placeRepository;

    public PlaceService(PlaceRepository placeRepository) {
        this.placeRepository = placeRepository;
    }

    public List<Place> getAllPlaces() {
        return placeRepository.findAll();
    }

    public Optional<Place> getPlaceById(Integer id) {
        return placeRepository.findById(id);
    }

    public List<Place> searchPlaces(String name) {
        return placeRepository.findByNameContainingIgnoreCase(name);
    }

    public Place savePlace(Place place) {
        return placeRepository.save(place);
    }

    public void deletePlace(Integer id) {
        placeRepository.deleteById(id);
    }
}
