package com.example.musicgamevideotool.model

import com.google.gson.annotations.SerializedName

data class Video(
    @SerializedName("_id")
    val id: String,
    val title: String,
    @SerializedName("gameName")
    val gameName: String,
    @SerializedName("cloudUrl")
    val cloudUrl: String,
    @SerializedName("coverUrl")
    val coverUrl: String? = null,
    val duration: Long? = null,
    @SerializedName("userId")
    val userId: String,
    val username: String? = null,
    @SerializedName("uploadTime")
    val uploadTime: String
)

// ✅ 确保这个类存在
data class VideoListResponse(
    val success: Boolean,
    val data: List<Video>,
    val error: String? = null
)