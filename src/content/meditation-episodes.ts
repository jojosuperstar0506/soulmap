/**
 * Open-source guided meditation episodes for Still Point (meditation tab).
 * Sourced from The Free Mindfulness Project (CC BY-NC-SA 3.0): https://www.freemindfulness.org/download
 * Direct MP3 links from their Google Drive; use non-commercially and credit as below.
 */

export type MeditationElement = "wood" | "fire" | "earth" | "metal" | "water";

export interface MeditationEpisode {
  id: string;
  title: string;
  /** Duration in seconds */
  durationSec: number;
  /** Display duration e.g. "5:31" */
  durationLabel: string;
  author: string;
  /** Element(s) this supports (for SoulMap balance) */
  elements: MeditationElement[];
  /** Direct MP3 URL */
  audioUrl: string;
  /** Short theme for UI */
  theme: string;
}

/** Google Drive direct download (uc?export=download&id=...) */
const gd = (id: string) => `https://drive.google.com/uc?export=download&id=${id}`;

export const MEDITATION_EPISODES: MeditationEpisode[] = [
  {
    id: "three-min-breath",
    title: "Three Minute Breathing",
    durationSec: 215,
    durationLabel: "3:35",
    author: "Peter Morgan",
    elements: ["water"],
    audioUrl: gd("1nzkNZ9r2SWWn86NTDykEkCj4HosAgfGb"),
    theme: "Quick reset",
  },
  {
    id: "five-min-breath-ucla",
    title: "Five Minute Breathing",
    durationSec: 331,
    durationLabel: "5:31",
    author: "UCLA Mindful Awareness Research Centre",
    elements: ["water"],
    audioUrl: gd("1eucLhrVRBT7FCTzdbpns7MCLb4PILK0t"),
    theme: "Breath awareness",
  },
  {
    id: "ten-min-breath",
    title: "Ten Minute Mindfulness of Breathing",
    durationSec: 601,
    durationLabel: "10:01",
    author: "Padraig O'Morain",
    elements: ["water"],
    audioUrl: gd("1F837yW9qSkmQCjoQYkHssgVNcVSOQIe7"),
    theme: "Flow & surrender",
  },
  {
    id: "breathing-space",
    title: "The Breathing Space",
    durationSec: 339,
    durationLabel: "5:39",
    author: "Vidyamala Burch, Breathworks",
    elements: ["earth", "water"],
    audioUrl: gd("19cCxG03o26RJB57g4xMUdyoDQlvaK8vS"),
    theme: "Grounding",
  },
  {
    id: "tension-release",
    title: "The Tension Release Meditation",
    durationSec: 345,
    durationLabel: "5:45",
    author: "Vidyamala Burch, Breathworks",
    elements: ["metal", "earth"],
    audioUrl: gd("1dcsW9byG8G4Gyb1hFvtFS27LnrBdfvDA"),
    theme: "Release & clarity",
  },
  {
    id: "three-step-breathing",
    title: "Three Step Breathing Space",
    durationSec: 214,
    durationLabel: "3:34",
    author: "Peter Morgan",
    elements: ["water", "metal"],
    audioUrl: gd("1ARGVWs6UMWAe8mTxExvTWVBurU65SDac"),
    theme: "Clarity",
  },
  {
    id: "brief-mindfulness",
    title: "Brief Mindfulness Practice",
    durationSec: 245,
    durationLabel: "4:05",
    author: "Padraig O'Morain",
    elements: ["wood", "water"],
    audioUrl: gd("19spOJz71lzbZiX5CDX7L-YNXrQutJPJX"),
    theme: "Present moment",
  },
  {
    id: "four-min-body-scan",
    title: "Four Minute Body Scan",
    durationSec: 241,
    durationLabel: "4:01",
    author: "Melbourne Mindfulness Centre & Still Mind",
    elements: ["earth"],
    audioUrl: gd("1JZ6NgU55LvekM5ZlZDc1nl8NGTxH8MtZ"),
    theme: "Grounding & stability",
  },
  {
    id: "mountain-morgan",
    title: "Mountain Meditation",
    durationSec: 492,
    durationLabel: "8:12",
    author: "Peter Morgan",
    elements: ["earth", "wood"],
    audioUrl: gd("1wAIv7C9qdfvQrHlybtV9bbqkdIZTQXI1"),
    theme: "Stability & vision",
  },
  {
    id: "compassionate-breath",
    title: "Compassionate Breath",
    durationSec: 693,
    durationLabel: "11:33",
    author: "Vidyamala Burch, Breathworks",
    elements: ["fire"],
    audioUrl: gd("1toFaicXEpAKaUoDxqWnpg1l3FT137ifw"),
    theme: "Warmth & connection",
  },
  {
    id: "ten-min-wisdom",
    title: "Ten Minute Wisdom Meditation",
    durationSec: 626,
    durationLabel: "10:26",
    author: "UCSD Center for Mindfulness",
    elements: ["metal"],
    audioUrl: gd("1VuklSoQ69h1jWmU2CKTJ72RR9HRmCucB"),
    theme: "Release & clarity",
  },
  {
    id: "breath-sound-body",
    title: "Breath, Sound and Body",
    durationSec: 720,
    durationLabel: "12:00",
    author: "UCLA Mindful Awareness Research Centre",
    elements: ["water", "earth"],
    audioUrl: gd("1Ip7JEkmvZetfK6SJgAtjm2rUC0RRH9Nz"),
    theme: "Full awareness",
  },
];

export const MEDITATION_SOURCE_LABEL = "The Free Mindfulness Project";
export const MEDITATION_SOURCE_URL = "https://www.freemindfulness.org/download";
export const MEDITATION_LICENSE = "CC BY-NC-SA 3.0";

export const ELEMENT_TABS: { element: MeditationElement; label: string; emoji: string }[] = [
  { element: "wood", label: "Wood", emoji: "🪵" },
  { element: "fire", label: "Fire", emoji: "🔥" },
  { element: "earth", label: "Earth", emoji: "🗿" },
  { element: "metal", label: "Metal", emoji: "🪙" },
  { element: "water", label: "Water", emoji: "💧" },
];
