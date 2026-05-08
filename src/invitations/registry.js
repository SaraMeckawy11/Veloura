import { lazy } from 'react';

/**
 * Template registry — maps template slugs to their invitation components and demo data.
 *
 * Each entry provides:
 *   - component:  lazy-loaded invitation component (receives { order, demo, publicSlug })
 *   - demoData:   function that returns a promise resolving to the demo order object
 *
 * To add a new template, create a folder under src/invitations/<slug>/
 * with an invitation component, splash screen, CSS, and demo data,
 * then register it here.
 */
const registry = {
  'boarding-pass': {
    component: lazy(() => import('./boarding-pass/BoardingPassInvitation')),
    demoData: () => import('./demoData').then(m => m.BOARDING_PASS_DEMO_ORDER),
  },
  'coastal-breeze': {
    component: lazy(() => import('./coastal-breeze/CoastalBreezeInvitation')),
    demoData: () => import('./coastal-breeze/demoData').then(m => m.COASTAL_BREEZE_DEMO_ORDER),
  },
  // Future templates:
  // 'velvet-rose': {
  //   component: lazy(() => import('./velvet-rose/VelvetRoseInvitation')),
  //   demoData: () => import('./velvet-rose/demoData').then(m => m.VELVET_ROSE_DEMO_ORDER),
  // },
};

export default registry;
