import { DEFAULT_PLUS_ONE_POLICY_TEXT } from '../shared';
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

export const GAZEBO_GARDEN_DEMO_ORDER = {
  referenceLayout: true,
  weddingDetails: {
    groomName: 'Lina',
    brideName: 'Omar',
    weddingDate: '2027-09-18T15:30:00.000Z',
    weddingTime: '5:30 PM',
    venue: 'Villa Aurelia Gardens',
    venueMapUrl:
      'https://www.google.com/maps?q=Villa%20Aurelia%20Rome&output=embed',
    message: 'A garden promise sealed in soft light.',
    plusOnePolicy: 'named-only',
    plusOnePolicyText: DEFAULT_PLUS_ONE_POLICY_TEXT,
    askPlusOne: true,
    flightNo: 'GAZEBO-2026',
  },
  storyMilestones: [
    {
      date: '2019',
      title: 'First Meeting',
      description: 'A simple coffee date became the start of something unforgettable.',
    },
    {
      date: '2020',
      title: 'First Adventure',
      description: 'Our first trip together turned into a memory we would always cherish.',
    },
    {
      date: '2022',
      title: 'A Golden Escape',
      description: 'A sunset walk through the city became one of our most cherished memories',
    },
    {
      date: '2025',
      title: 'The Proposal',
      description: 'A quiet sunset, a beautiful view, and a promise for forever.',
    },
  ],
  storyImages: [
    { src: story1, fit: 'contain' },
    { src: story2, fit: 'contain' },
    { src: story3, fit: 'contain' },
    { src: story4, fit: 'contain' },
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
