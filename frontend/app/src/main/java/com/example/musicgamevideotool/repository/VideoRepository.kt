package com.example.musicgamevideotool.repository

import com.example.musicgamevideotool.model.Video

class VideoRepository {

    private val mockVideos = listOf(
        Video(
            id = "1",
            title = "Arcaea 魔王曲练习",
            gameName = "Arcaea",
            cloudUrl = "",
            userId = "user_001",  // ✅ 添加 userId
            uploadTime = "2026-03-30T10:00:00Z"
        ),
        Video(
            id = "2",
            title = "Phigros 练习视频",
            gameName = "Phigros",
            cloudUrl = "",
            userId = "user_001",  // ✅ 添加 userId
            uploadTime = "2026-03-29T15:30:00Z"
        ),
        Video(
            id = "3",
            title = "Cytus II 难点解析",
            gameName = "Cytus II",
            cloudUrl = "",
            userId = "user_002",  // ✅ 添加 userId
            uploadTime = "2026-03-28T12:00:00Z"
        )
    )

    suspend fun getVideos(): Result<List<Video>> {
        kotlinx.coroutines.delay(500)
        return Result.success(mockVideos)
    }
}