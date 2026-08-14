import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Flip } from 'gsap/Flip';
import { Draggable } from 'gsap/Draggable';
import { Observer } from 'gsap/Observer';

/**
 * GSAP singleton with the free (non-Club) plugins registered exactly once.
 * `SplitText` and `InertiaPlugin` are GreenSock Club (paid) and are therefore
 * approximated with Framer Motion springs + free GSAP tweens elsewhere.
 */
let registered = false;

if (typeof window !== 'undefined' && !registered) {
  gsap.registerPlugin(ScrollTrigger, Flip, Draggable, Observer);
  registered = true;
}

export { gsap, ScrollTrigger, Flip, Draggable, Observer };

/**
 * Shared cubic-bezier easing for the "Awwwards" entrance choreography.
 */
export const EASE_OUT_EXPO = 'cubic-bezier(0.16, 1, 0.3, 1)';
