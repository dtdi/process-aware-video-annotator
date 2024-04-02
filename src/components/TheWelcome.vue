<script setup>
import VideoPlayer from './VideoPlayer.vue'

const videoOptions = {
  autoplay: true,
  controlBar: { skipButtons: { forward: 5 } },
  controls: true,
  enableSmoothSeeking: true,
  sources: [
    {
      src:
        'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      type: 'video/mp4'
    }
  ]
};
</script>

<template>
  <div>
    <video-player :options="videoOptions" />
  </div>
</template>
