<script setup>
import { VideoPlayer } from '@videojs-player/vue'
import { computed, onMounted, reactive, ref } from 'vue';

const { config } = defineProps(['config'])

const currentSegment = ref();

const currentSubSegment = ref();

onMounted(() => {
  if (!track.value) {
    // track.value.offset = (new Date()).toISOString();
    // track.value.id = uniqid();
  }


  //currentSegment.value = track.value.localisations[0];
});


const assets = computed(() => {
  return config.assets.map((a) => a.id)
});

const roles = computed(() => {
  return config.roles.map((a) => a.actor)
});

const track = ref();

function removeContainer(container) {
  const index = track.value.localisations.indexOf(container);

  track.value.localisations.splice(index, 1);

  currentSegment.value = track.value.localisations[0];
}

function addContainer() {
  const defaultNewContainer = {
    "type": "data",
    "data": {
      "process": "",
      "label": "",
    },
    "tcin": null,
    "tcout": null,
    "tclevel": 0,
    "localisation": [
      {
        "tcin": null,
        "tcout": null,
        "level": 1,
        "data": {
          "activity": null,
          "objects": [],
          "locations": [],
          "attributes": []
        }
      }
    ]
  }

  track.value.localisations.push(defaultNewContainer)

  currentSegment.value = defaultNewContainer;
}

function addSegment(container) {
  const defaultNewSegment = {
    "tcin": currentTime.value,
    "tcout": currentTime.value,
    "level": 1,
    "data": {
      "activity": config.activities[0],
      "note": "",
      "objects": [],
      "actors": [],
      "attributes": []
    }
  };
  container.localisation.push(defaultNewSegment)
  currentSubSegment.value = defaultNewSegment;
}

function removeSegment(container, segment) {
  const index = container.localisation.indexOf(segment);

  container.localisation.splice(index, 1);
  currentSubSegment.value = '';
}

const offsetDate = computed({
  get() {
    let d = new Date(track.value.offset);
    return d.toISOString().slice(0, 10);
  },
  set(value) {
    let d = new Date(value);
    const newDate = (d.toISOString().split('T'))[0];
    const oldTime = (new Date(track.value.offset).toISOString().split('T'))[1];
    track.value.offset = new Date(newDate + 'T' + oldTime).toISOString();
  }
});

const offsetTime = computed({
  get() {
    return new Date(track.value.offset).toISOString().slice(11, 23)
  },
  set(value) {
    const newTime = value;
    const oldDate = (new Date(track.value.offset).toISOString().split('T'))[0];
    let d = new Date(oldDate + 'T' + newTime);
    if (d instanceof Date && !isNaN(d)) {
      d = new Date(d.getTime() - d.getTimezoneOffset() * 60 * 1000);
      console.log(d.toISOString(), d.getTimezoneOffset())
      track.value.offset = d.toISOString();
    }
  }
})

const currentTime = computed(() => {
  const l = new Date(track.value.offset).getTime();
  return formatTime(l + time.value);
})

const videoOptions = {
  preload: true,
  controlBar: { skipButtons: { forward: 5 } },
  enableSmoothScrolling: true
}

const playerObj = ref();

function togglePlay() { playerObj.value.paused() ? playerObj.value.play() : playerObj.value.pause() }

function formatTime(miliseconds) {
  return new Date(miliseconds).toISOString().slice(11, 23);
}

const onPlayerMounted = function ({ video, player, state }) {
  playerObj.value = player;
  window.player = player;
}

function setTimeFor(value, place) {
  console.log(value, place);
  value[place] = currentTime.value;
}

const currentFile = computed(() => {
  return [{
    src: track.value?.file,
    type: 'video/mp4'
  }];
});

const time = ref(0);

function jump(secs) {
  playerObj.value.currentTime(playerObj.value.currentTime() + secs)
}


function newTrack() {
  track.value = { "id": uniqid(), "label": "Scene X", "file": "http://localhost:8081/?video=scene1.mp4", "offset": "2024-03-25T08:48:23.000Z", "type": "segments", "version": 1, "processed": null, "processor": "Tobias Fehrer", "localisations": [] };
}

const stream = import.meta.env.VITE_STREAM;

function loadSceneFile(event) {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const d = (JSON.parse(e.target.result));
        track.value = d;
        track.value.file = stream + d.file;

        currentSegment.value = track.value.localisations[0];
        currentSubSegment.value = currentSegment.value.localisation[0];

      } catch (error) {
        console.error("Error parsing JSON:", error);
      }
    };
    reader.readAsText(file);
  }
}

function exportToJson() {
  if (track.value) {
    const t = new Date().getTime();
    track.value.processed = t;
    const jsonBlob = new Blob([JSON.stringify(track.value)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(jsonBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${track.value.label}_${track.value.processed}.json`;
    a.click();
    URL.revokeObjectURL(url);
  } else {
    console.warn("No JSON data to export.");
  }
}

function sortSegments(segment) {
  segment.localisation.sort((a, b) => a.tcin.localeCompare(b.tcin))
}


function selectSegment(segment) {
  currentSubSegment.value = segment;

}

function onPlayerTimeUpdate() {
  // Allows for smooth scrubbing, when player can't keep up.
  let t;
  if (!playerObj || !playerObj.value) return new Date().getTime();
  if (playerObj.value.ended()) {
    t = playerObj.value.duration();
  } else {
    t = (playerObj.value.scrubbing()) ? playerObj.value.getCache().currentTime : playerObj.value.currentTime();
  }
  time.value = t * 1000;
  return t;
};

function uniqid(prefix = "", random = false) {
  const sec = Date.now() * 1000 + Math.random() * 1000;
  const id = sec.toString(16).replace(/\./g, "").padEnd(14, "0");
  return `${prefix}${id}${random ? `.${Math.trunc(Math.random() * 100000000)}` : ""}`;
};

</script>

<template>
  <div class="offcanvas offcanvas-start" tabindex="-1" id="offcanvasTrack" aria-labelledby="offcanvasTrackLabel">
    <div class="offcanvas-header">
      <h5 class="offcanvas-title" id="offcanvasTrackLabel">Track Settings</h5>
      <button type="button" class="btn-close" data-bs-dismiss="offcanvas" aria-label="Close"></button>
    </div>
    <div v-if="track" class="offcanvas-body">
      <div class="mb-3">
        <label for="trackId" class="form-label">Track ID (Random)</label>
        <input id="trackId" type="text" v-model="track.id" class="form-control" aria-label="ID">
      </div>
      <div class="mb-3">
        <label for="trackLabel" class="form-label">Track label (Scene ID)</label>
        <input id="trackLabel" type="text" v-model="track.label" class="form-control" aria-label="Label">
      </div>
      <div class="mb-3">
        <label for="trackProcessor" class="form-label">Processor</label>
        <input id="trackProcessor" type="text" v-model="track.processor" class="form-control">
      </div>
      <div class="mb-3">
        <label for="offset-date" class="form-label">Offset</label>

        <div class="input-group">
          <input v-model="offsetDate" required id="offset-date" type="date" class="form-control" />
          <input id="offset-time" class="form-control" type="text" required v-model="offsetTime"
            title="Write a duration in the format hh:mm:ss.ms">
        </div>
      </div>

    </div>
  </div>
  <header class="container-fluid bg-body-tertiary">
    <nav class="navbar">
      <span v-if="track" class="navbar-brand">{{ track.label }} <button class="btn btn-sm btn-primary" type="button"
          data-bs-toggle="offcanvas" data-bs-target="#offcanvasTrack" aria-controls="offcanvasTrack">
          Edit</button></span>


    </nav>
  </header>
  <section class="flex-fill d-flex main">
    <div class="w-50 d-flex flex-column">
      <div>
        <div v-if="track" class="card text-bg-light mt-2 mb-2">
          <div class="card-body">
            <div class="row mb-2">
              <div class="col-sm-3 col-form-label">
                <label for="local">Select Process</label>
              </div>
              <div class="col-sm">
                <div class="input-group input-group-sm">
                  <select v-model="currentSegment" class="form-select" id="local">
                    <option v-for="(local, idx) in  track.localisations" :value="local">{{ local.data.label }} ({{
      local.data.process }})</option>
                  </select>
                  <button class="btn btn-success" @click="addContainer"><i class="bi bi-plus"></i></button>

                </div>
              </div>
            </div>
            <div v-if="currentSegment" class="row mb-2 g-3">
              <div class="col-sm">
                <input type="text" v-model="currentSegment.data.label" class="form-control form-control-sm"
                  placeholder="Running ID" aria-label="Label">
              </div>
              <div class="col-sm-6">
                <select v-model="currentSegment.data.process" class="form-select form-select-sm" aria-label="Process"
                  placeholder="Process">
                  <option v-for="process in config.processes" :value="process.label">{{ process.id }} {{
      process.label }}</option>
                </select>
              </div>
              <div class="col-sm">
                <input type="text" v-model="currentSegment.data.variant" class=" form-control-sm form-control"
                  placeholder="Variant" aria-label="Variant">
              </div>
              <div class="col-sm"> <button title="trash scene" class="btn btn-sm btn-danger"
                  @click="removeContainer(currentSegment)"><i class="bi bi-trash"></i></button> </div>
            </div>
            <div class="row mb-2">
              <div class="input-group input-group-lg">
                <button title="SHIFT + D" v-shortkey="['shift', 'd']" @shortkey="jump(-1)" @click="jump(-1)"
                  class="btn btn-secondary">-1</button>
                <button title="SPACE" v-shortkey="['space']" @shortkey="togglePlay" class="btn btn-sm btn-primary"
                  @click="togglePlay">
                  <i v-if="playerObj && playerObj.paused()" class="bi btn-sm bi-play"></i>
                  <i v-else class="bi bi-pause"></i>
                </button>
                <button title="SHIFT + F" v-shortkey="['shift', 'f']" @shortkey="jump(1)" @click="jump(1)"
                  class="btn btn-secondary">1</button>
                <button title="SHIFT + G" v-shortkey="['shift', 'g']" @shortkey="jump(5)" @click="jump(5)"
                  class="btn btn-secondary">5</button>
                <span class="input-group-text">{{ currentTime }}</span>
                <button title="SHIFT + ENTER" v-shortkey="['shift', 'enter']" @shortkey="addSegment(currentSegment)"
                  @click="addSegment(currentSegment)" class="btn btn-success">add</button>
                <button title="sort segments" @click="sortSegments(currentSegment)" class="btn btn-outline-primary"><i
                    class="bi bi-sort-numeric-down"></i></button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div v-if="currentSubSegment" class="flex-fill" style="overflow-y: auto;">
        <div class="card ">
          <div class="card-body">
            <div class="row g-3">
              <div class="col-sm-6">
                <div class="input-group-sm input-group">
                  <input class="form-control" type="text" required v-model="currentSubSegment.tcin"
                    title="Write a duration in the format hh:mm:ss.ms">
                  <button title="start timestamp" @click="setTimeFor(currentSubSegment, 'tcin')"
                    class="btn btn-outline-primary"><i class="bi bi-stopwatch"></i></button>
                </div>
              </div>
              <div class="col-sm-6">
                <div class="input-group input-group-sm">
                  <input class="form-control" type="text" v-model="currentSubSegment.tcout"
                    title="Write a duration in the format hh:mm:ss.ms">
                  <button title="end timestamp" @click="setTimeFor(currentSubSegment, 'tcout')"
                    class="btn btn-outline-primary"><i class="bi bi-stopwatch-fill"></i></button>
                </div>
              </div>
              <div class="col-sm-4">
                <select v-model="currentSubSegment.data.activity" class="form-select form-select-sm"
                  aria-label="Activities">
                  <option v-for="activity in config.activities" :value="activity">{{
      activity }}</option>
                </select>
              </div>
              <div class="col-sm-8">
                <input type="text" v-model="currentSubSegment.data.notes" class="form-control form-control-sm"
                  placeholder="Notes" aria-label="Label">
              </div>
              <div class="col-sm">

                <select v-model="currentSubSegment.data.objects" class="form-select form-select-sm" multiple>
                  <option v-for="elem in track.config.assets" :value="elem">{{ elem }}</option>
                </select>

                <venAutocomplete class="objects" :list="assets" v-model="currentSubSegment.data.objects"
                  placeholder="Objects" />

              </div>
              <div class="col-sm">

                <select v-model="currentSubSegment.data.actors" class="form-select form-select-sm" multiple>
                  <option v-for="elem in track.config.actors" :value="elem">{{ elem }}</option>
                </select>

                <venAutocomplete class="roles" :list="roles" v-model="currentSubSegment.data.actors"
                  placeholder="Roles" />

              </div>
              <div class="col-sm-4">

                <select v-model="currentSubSegment.data.locations" class="form-select form-select-sm" multiple>
                  <option v-for="elem in config.locations" :value="elem">{{ elem }}</option>
                </select>

              </div>



            </div>
          </div>


          <div class="list-group">
            <a class="list-group-item-action list-group-item  d-flex justify-content-between align-items-center"
              @click.prevent="selectSegment(segment)" v-for="(segment, idx) in  currentSegment.localisation">

              <span><small class="fw-bold"> {{ segment.tcin }}-{{ segment.tcout }}</small> {{
      segment.data.activity }}
                <span v-for="badge in segment.data.objects" class="badge objects me-1">{{ badge }}</span>
                <span v-for="badge in segment.data.actors" class="badge roles me-1">{{ badge }}</span>
                <span v-for="badge in segment.data.locations" class="badge locations me-1">{{ badge }}</span>
              </span>
              <button title="delete segment" @click="removeSegment(currentSegment, segment)"
                class="btn btn-sm btn-danger"><i class="bi bi-trash"></i></button></a>
          </div>
        </div>

      </div>




    </div>
    <div class="flex-grow-1 video-container">
      <video-player v-if="track?.file" style="height: 100%; width: auto;" :sources="currentFile"
        @mounted="onPlayerMounted" ref="player" :controls=true :options="videoOptions"
        @timeupdate="onPlayerTimeUpdate" />
    </div>
  </section>
  <footer class="container-fluid">
    <nav class="navbar">
      <div class="d-flex">
        <button title="create new track" @click="newTrack" class="btn btn-sm me-2 btn-success"><i
            class="bi bi-plus"></i></button>

        <input title="upload track from file" @change="loadSceneFile" type="file" accept=".json"
          class="form-control form-control-sm">
      </div>
      <div class="d-flex">
        <button @click="exportToJson" class="btn btn-primary"><i class="bi bi-download"> </i> download</button>
      </div>
    </nav>
  </footer>
</template>

<style scoped>
.main {

  overflow: hidden;
}



footer {
  background-color: blanchedalmond;
}
</style>
