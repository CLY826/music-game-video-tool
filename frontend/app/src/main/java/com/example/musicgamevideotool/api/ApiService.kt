package com.example.musicgamevideotool.api

import com.example.musicgamevideotool.model.VideoListResponse
import retrofit2.Response
import retrofit2.http.GET
import retrofit2.http.Query

interface ApiService {

    @GET("api/videos")
    suspend fun getVideos(
        @Query("page") page: Int? = null,
        @Query("limit") limit: Int? = null
    ): Response<VideoListResponse>  // ✅ 使用 VideoListResponse
}