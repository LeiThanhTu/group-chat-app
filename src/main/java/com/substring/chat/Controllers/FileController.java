package com.substring.chat.Controllers;

import com.substring.chat.service.FileStorageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Path;
import java.nio.file.Paths;

@RestController
@RequestMapping("/api/files")
@CrossOrigin("http://localhost:5173")
public class FileController {

    private final FileStorageService fileStorageService;

    @Autowired
    public FileController(FileStorageService fileStorageService) {
        this.fileStorageService = fileStorageService;
    }

    @PostMapping("/upload")
    public String uploadFile(@RequestParam("file") MultipartFile file) {
        try {
            String fileName = fileStorageService.storeFile(file);
            return "/api/files/" + fileName;  // Return full path
        } catch (Exception e) {
            throw new RuntimeException("Could not upload the file: " + e.getMessage());
        }
    }
    @GetMapping("/{fileName:.+}")
    public ResponseEntity<byte[]> getFile(@PathVariable String fileName) {
        try {
            byte[] fileContent = fileStorageService.loadFileAsBytes(fileName);
            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_OCTET_STREAM)
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fileName + "\"")
                    .body(fileContent);
        } catch (IOException e) {
            throw new RuntimeException("Could not read the file: " + e.getMessage());
        }
    }
}
