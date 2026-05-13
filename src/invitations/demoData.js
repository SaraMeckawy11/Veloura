/**
 * Demo data for the Boarding Pass invitation template.
 */
import gallery1 from '../assets/gallery-1.png';
import gallery2 from '../assets/gallery-2.png';
import gallery3 from '../assets/gallery-3.png';
import gallery4 from '../assets/gallery-4.png';
import gallery5 from '../assets/gallery-5.png';
import gallery6 from '../assets/gallery-6.png';
import story1 from '../assets/story-1.png';
import story2 from '../assets/story-2.png';
import story3 from '../assets/story-3.png';
import story4 from '../assets/story-4.png';

export const BOARDING_PASS_DEMO_ORDER = {
  referenceLayout: true,
  weddingDetails: {
    groomName: 'Omar',
    brideName: 'Layla',
    weddingDate: '2026-06-20T17:00:00.000Z',
    weddingTime: '5:00 PM',
    venue: 'The Grand Pavilion',
    venueAddress: '123 Garden Avenue, Dubai',
    venueMapUrl:
      'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3610.1786!2d55.2708!3d25.1972!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMjXCsDExJzUwLjAiTiA1NcKwMTYnMTUuMCJF!5e0!3m2!1sen!2sae!4v1234567890',
    message: 'Two Souls, One Destination.',
    flightNo: 'WD-2026',
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
