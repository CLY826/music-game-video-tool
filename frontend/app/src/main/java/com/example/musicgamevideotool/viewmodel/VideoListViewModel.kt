package com.example.musicgamevideotool.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.musicgamevideotool.model.Video
import com.example.musicgamevideotool.repository.VideoRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch

class VideoListViewModel : ViewModel() {

    private val repository = VideoRepository()

    private val _videos = MutableStateFlow<List<Video>>(emptyList())
    val videos: StateFlow<List<Video>> = _videos

    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading

    private val _error = MutableStateFlow<String?>(null)
    val error: StateFlow<String?> = _error

    fun loadVideos() {
        viewModelScope.launch {
            _isLoading.value = true
            _error.value = null

            val result = repository.getVideos()

            result.onSuccess { videos ->
                _videos.value = videos
            }.onFailure { error ->
                _error.value = error.message ?: "加载失败"
            }

            _isLoading.value = false
        }
    }

    fun refresh() {
        loadVideos()
    }
}