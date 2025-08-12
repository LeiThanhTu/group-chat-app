package com.substring.chat.Controllers;

import com.substring.chat.config.AppConstants;
import com.substring.chat.entities.Message;
import com.substring.chat.entities.Room;
import com.substring.chat.payload.MessageRequest;
import com.substring.chat.repositories.RoomRepository;
import com.substring.chat.service.FileStorageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;

@RestController
@CrossOrigin(AppConstants.FRONT_END_BASE_URL)
public class ChatController {

    private final RoomRepository roomRepository;
    private final FileStorageService fileStorageService;

    @Autowired
    public ChatController(RoomRepository roomRepository, FileStorageService fileStorageService) {
        this.roomRepository = roomRepository;
        this.fileStorageService = fileStorageService;
    }


    //for sending and receiving messages
    @MessageMapping("/sendMessage/{roomId}")// /app/sendMessage/roomId
    @SendTo("/topic/room/{roomId}")//subscribe
    public Message sendMessage(
            @DestinationVariable String roomId,
            @RequestBody MessageRequest request
    ) {
        // Validate that either content or fileUrl is present
        boolean hasContent = request.getContent() != null && !request.getContent().trim().isEmpty();
        boolean hasFile = request.getFileUrl() != null &&
                !request.getFileUrl().trim().isEmpty() &&
                !"null".equals(request.getFileUrl().trim());

        if (!hasContent && !hasFile) {
            throw new RuntimeException("Message must contain either text or a file");
        }

        Room room = roomRepository.findByRoomId(roomId);  // Use the path variable roomId
        if (room == null) {
            throw new RuntimeException("Room not found!!");
        }

        Message message = new Message();
        message.setContent(hasContent ? request.getContent().trim() : "");
        message.setSender(request.getSender());
        message.setTimeStamp(LocalDateTime.now());

        // Handle file if present
        if (hasFile && request.getFileName() != null && !request.getFileName().trim().isEmpty()) {
            message.setFileName(request.getFileName().trim());
            message.setFileUrl(request.getFileUrl().trim());
            System.out.println("Sending file message - Name: " + message.getFileName() + ", URL: " + message.getFileUrl());
        }

        room.getMessages().add(message);
        roomRepository.save(room);

        return message;
    }

    @PostMapping("/upload")
    public String handleFileUpload(@RequestParam("file") MultipartFile file) {
        try {
            String fileName = fileStorageService.storeFile(file);
            return fileStorageService.getFileUrl(fileName);
        } catch (Exception e) {
            throw new RuntimeException("Could not upload the file: " + e.getMessage());
        }
    }
}