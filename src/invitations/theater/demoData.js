import gallery1 from '../../assets/gallery-1.png';
import gallery2 from '../../assets/gallery-2.png';
import gallery3 from '../../assets/gallery-3.png';
import gallery4 from '../../assets/gallery-4.png';
import gallery5 from '../../assets/gallery-5.png';
import gallery6 from '../../assets/gallery-6.png';
import story1 from '../../assets/story-1.png';
import story2 from '../../assets/story-2.png';
import story3 from '../../assets/story-3.png';
import story4 from '../../assets/story-4.png';

export const THEATER_DEMO_ORDER = {
  referenceLayout: true,
  weddingDetails: {
    groomName: 'Adrian',
    brideName: 'Noor',
    weddingDate: '2026-10-12T19:30:00.000Z',
    weddingTime: '7:30 PM',
    venue: 'The Grand Opera House',
    venueAddress: 'Cairo Opera House, Zamalek',
    venueMapUrl:
      'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3610.1786!2d31.2357!3d30.0444!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMzDCsDAyJzM5LjgiTiAzMcKwMTQnMDguNSJF!5e0!3m2!1sen!2seg!4v1234567890',
    message: 'Tonight, the curtain rises on forever.',
    flightNo: 'ACT-2026',
  },
  storyMilestones: [
    {
      date: '2018',
      title: 'Curtain Call',
      description: 'A chance encounter after the show - and our story began with applause still echoing.',
    },
    {
      date: '2020',
      title: 'Opening Night',
      description: 'Our first trip together felt like the premiere of a play we never wanted to end.',
    },
    {
      date: '2023',
      title: 'Center Stage',
      description: 'We moved in, and every quiet evening became a duet worth memorizing.',
    },
    {
      date: '2025',
      title: 'The Proposal',
      description: 'Under a single warm spotlight, a question - and the only possible answer.',
    },
  ],
  storyImages: [
    { src: story1, fit: 'cover' },
    { src: story2, fit: 'cover' },
    { src: story3, fit: 'cover' },
    { src: story4, fit: 'cover' },
  ],
  galleryImages: [
    { src: gallery1, fit: 'cover' },
    { src: gallery2, fit: 'cover' },
    { src: gallery3, fit: 'cover' },
    { src: gallery4, fit: 'cover' },
    { src: gallery5, fit: 'cover' },
    { src: gallery6, fit: 'cover' },
  ],
  photos: [],
};
