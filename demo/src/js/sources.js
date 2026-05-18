const sources = {
  mux: {
    type: 'video',
    title: 'View From A Blue Moon',
    ratio: '16:9',
    hlsSource: 'https://stream.mux.com/lyrKpPcGfqyzeI00jZAfW6MvP6GNPrkML.m3u8',
    poster: 'https://image.mux.com/lyrKpPcGfqyzeI00jZAfW6MvP6GNPrkML/thumbnail.jpg',
    previewThumbnails: {
      enabled: true,
      src: 'https://image.mux.com/lyrKpPcGfqyzeI00jZAfW6MvP6GNPrkML/storyboard.vtt',
    },
  },
  video: {
    type: 'video',
    title: 'View From A Blue Moon',
    ratio: '16:9',
    sources: [
      {
        src: 'https://cdn.plyr.io/static/demo/View_From_A_Blue_Moon_Trailer-576p.mp4',
        type: 'video/mp4',
        size: 576,
      },
      {
        src: 'https://cdn.plyr.io/static/demo/View_From_A_Blue_Moon_Trailer-720p.mp4',
        type: 'video/mp4',
        size: 720,
      },
      {
        src: 'https://cdn.plyr.io/static/demo/View_From_A_Blue_Moon_Trailer-1080p.mp4',
        type: 'video/mp4',
        size: 1080,
      },
      {
        src: 'https://cdn.plyr.io/static/demo/View_From_A_Blue_Moon_Trailer-1440p.mp4',
        type: 'video/mp4',
        size: 1440,
      },
    ],
    poster: 'https://cdn.plyr.io/static/demo/View_From_A_Blue_Moon_Trailer-HD.jpg',
    tracks: [
      {
        kind: 'captions',
        label: 'English',
        srclang: 'en',
        src: 'https://cdn.plyr.io/static/demo/View_From_A_Blue_Moon_Trailer-HD.en.vtt',
        default: true,
      },
      {
        kind: 'captions',
        label: 'French',
        srclang: 'fr',
        src: 'https://cdn.plyr.io/static/demo/View_From_A_Blue_Moon_Trailer-HD.fr.vtt',
      },
    ],
    previewThumbnails: {
      enabled: true,
      src: [
        'https://cdn.plyr.io/static/demo/thumbs/100p.vtt',
        'https://cdn.plyr.io/static/demo/thumbs/240p.vtt',
      ],
    },
    mediaMetadata: {
      title: 'View From A Blue Moon',
      album: 'Sports',
      artist: 'Brainfarm',
      artwork: [
        {
          src: 'https://cdn.plyr.io/static/demo/View_From_A_Blue_Moon_Trailer-HD.jpg',
          type: 'image/jpeg',
        },
      ],
    },
    markers: {
      enabled: true,
      points: [
        {
          time: 10,
          label: 'First marker',
        },
        {
          time: 40,
          label: 'Second marker',
        },
        {
          time: 120,
          label: '<strong>Third</strong> marker',
        },
      ],
    },
  },
  audio: {
    type: 'audio',
    title: 'Kishi Bashi &ndash; &ldquo;It All Began With A Burst&rdquo;',
    sources: [
      {
        src: 'https://cdn.plyr.io/static/demo/Kishi_Bashi_-_It_All_Began_With_a_Burst.mp3',
        type: 'audio/mp3',
      },
      {
        src: 'https://cdn.plyr.io/static/demo/Kishi_Bashi_-_It_All_Began_With_a_Burst.ogg',
        type: 'audio/ogg',
      },
    ],
  },
  youtube: {
    type: 'video',
    ratio: '16:9',
    sources: [
      {
        src: 'https://youtube.com/watch?v=bTqVqk7FSmY',
        provider: 'youtube',
      },
    ],
    mediaMetadata: {
      title: 'View From A Blue Moon',
      album: 'Sports',
      artist: 'Brainfarm',
      artwork: [
        {
          src: 'https://cdn.plyr.io/static/demo/View_From_A_Blue_Moon_Trailer-HD.jpg',
          type: 'image/jpeg',
        },
      ],
    },
  },
  vimeo: {
    type: 'video',
    ratio: '16:9',
    sources: [
      {
        src: 'https://vimeo.com/40648169',
        provider: 'vimeo',
      },
    ],
  },
  // Russian video platforms
  rutube: {
    type: 'video',
    ratio: '16:9',
    sources: [
      {
        src: 'https://rutube.ru/video/f553aa769c9cd088b33d356f5fd84abd/?r=plwd',
        provider: 'rutube',
      },
    ],
  },
  rutubeplaylist: {
    type: 'video',
    ratio: '16:9',
    sources: [
      {
        src: 'https://rutube.ru/plst/1167014/',
        provider: 'rutube',
      },
    ],
    rutube: {
      playlistId: '1167014',
    },
  },
  yandex: {
    type: 'video',
    ratio: '16:9',
    sources: [
      {
        src: 'https://video.cloud.yandex.net/player/7c10a15d-1e87-4d6e-a0e7-8f0f5e5c5e5d',
        provider: 'yandex',
      },
    ],
  },
  vk: {
    type: 'video',
    ratio: '16:9',
    sources: [
      {
        src: 'https://vk.com/video-40602947_456239058',
        provider: 'vk',
      },
    ],
  },
  mailru: {
    type: 'video',
    ratio: '16:9',
    sources: [
      {
        src: 'https://my.mail.ru/video/embed/6353406850491756603',
        provider: 'mailru',
      },
    ],
  },
  mtslink: {
    type: 'video',
    ratio: '16:9',
    sources: [
      {
        src: 'https://player.mts-link.ru/j/7c10a15d-1e87-4d6e-a0e7-8f0f5e5c5e5d',
        provider: 'mtslink',
      },
    ],
  },
};

// Gallery data for the video selection view
const gallery = [
  {
    id: 'video',
    title: 'View From A Blue Moon',
    subtitle: 'Brainfarm • Sports',
    poster: 'https://cdn.plyr.io/static/demo/View_From_A_Blue_Moon_Trailer-HD.jpg',
    duration: '2:30',
    provider: 'html5',
    providerLabel: 'HTML5',
  },
  {
    id: 'youtube',
    title: 'View From A Blue Moon (YouTube)',
    subtitle: 'Brainfarm',
    poster: 'https://img.youtube.com/vi/bTqVqk7FSmY/maxresdefault.jpg',
    duration: '2:30',
    provider: 'youtube',
    providerLabel: 'YouTube',
  },
  {
    id: 'vimeo',
    title: 'Toob "Wavaphon" Music Video',
    subtitle: 'Vimeo Staff Pick',
    poster: 'https://vumbnail.com/40648169.jpg',
    duration: '3:15',
    provider: 'vimeo',
    providerLabel: 'Vimeo',
  },
  {
    id: 'mux',
    title: 'View From A Blue Moon (HLS)',
    subtitle: 'Streaming via Mux',
    poster: 'https://image.mux.com/lyrKpPcGfqyzeI00jZAfW6MvP6GNPrkML/thumbnail.jpg',
    duration: '2:30',
    provider: 'mux',
    providerLabel: 'Mux',
  },
  {
    id: 'rutube',
    title: 'Rutube Video Demo',
    subtitle: 'Rutube Platform',
    poster: 'https://cdn.plyr.io/static/demo/View_From_A_Blue_Moon_Trailer-HD.jpg',
    duration: '5:00',
    provider: 'rutube',
    providerLabel: 'Rutube',
  },
  {
    id: 'rutubeplaylist',
    title: 'Rutube Playlist Demo',
    subtitle: 'Playlist from Rutube',
    poster: 'https://cdn.plyr.io/static/demo/View_From_A_Blue_Moon_Trailer-HD.jpg',
    duration: 'Playlist',
    provider: 'rutube',
    providerLabel: 'Rutube Playlist',
  },
  {
    id: 'vk',
    title: 'VK Video Demo',
    subtitle: 'VK Platform',
    poster: 'https://cdn.plyr.io/static/demo/View_From_A_Blue_Moon_Trailer-HD.jpg',
    duration: '3:45',
    provider: 'vk',
    providerLabel: 'VK',
  },
  {
    id: 'yandex',
    title: 'Yandex Cloud Video',
    subtitle: 'Yandex Platform',
    poster: 'https://cdn.plyr.io/static/demo/View_From_A_Blue_Moon_Trailer-HD.jpg',
    duration: '4:20',
    provider: 'yandex',
    providerLabel: 'Yandex',
  },
  {
    id: 'mailru',
    title: 'Mail.ru Video',
    subtitle: 'Mail.ru Platform',
    poster: 'https://cdn.plyr.io/static/demo/View_From_A_Blue_Moon_Trailer-HD.jpg',
    duration: '2:10',
    provider: 'mailru',
    providerLabel: 'Mail.ru',
  },
  {
    id: 'mtslink',
    title: 'MTS Link Video',
    subtitle: 'MTS Link Platform',
    poster: 'https://cdn.plyr.io/static/demo/View_From_A_Blue_Moon_Trailer-HD.jpg',
    duration: '3:30',
    provider: 'mtslink',
    providerLabel: 'MTS Link',
  },
];

export { gallery };
export default sources;
