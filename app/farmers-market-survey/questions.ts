export type QuestionType =
  | "single-select"
  | "multi-select"
  | "rating"
  | "text"
  | "email";

export interface Question {
  id: string;
  title: string;
  subtitle?: string;
  type: QuestionType;
  options?: string[];
  hasOther?: boolean;
  hasOpenText?: boolean;
  openTextLabel?: string;
  required?: boolean;
}

export const questions: Question[] = [
  {
    id: "town",
    title: "In which town or village do you currently live?",
    type: "single-select",
    options: [
      "Whitefish Bay",
      "Glendale",
      "Shorewood",
      "Bayside",
      "Fox Point",
      "Mequon",
    ],
    hasOther: true,
    required: true,
  },
  {
    id: "markets_visited",
    title: "In the past month, which farmers markets have you visited?",
    type: "multi-select",
    options: [
      "Whitefish Bay Farmers Market (Saturdays)",
      "Fox Point Farmers Market",
      "Shorewood Farmers Market",
      "Thiensville Farmers Market",
      "Brown Deer Farmers Market",
      "Haven't attended",
    ],
    hasOther: true,
    required: true,
  },
  {
    id: "visit_frequency",
    title: "How often did you visit a farmers market last summer?",
    type: "single-select",
    options: ["Weekly", "2-3x per month", "A few times", "Never"],
    required: true,
  },
  {
    id: "wfb_attendance",
    title:
      "Have you attended the Whitefish Bay Farmers Market this season or in previous seasons?",
    type: "single-select",
    options: [
      "Yes, this season",
      "Yes, in the past",
      "No",
      "I didn't know they had a farmers market",
    ],
    required: true,
  },
  {
    id: "wfb_rating",
    title:
      "How would you rate your experience at the Whitefish Bay Farmers Market?",
    type: "rating",
    options: ["1", "2", "3", "4", "5", "I have never attended"],
    hasOpenText: true,
    openTextLabel: "Please elaborate on your rating",
    required: true,
  },
  {
    id: "preferred_time",
    title:
      "Realistically, which farmers market time would you attend most often?",
    type: "single-select",
    options: [
      "Saturday morning (9AM - 2PM)",
      "Sunday morning (9AM - 2PM)",
      "Tuesday evening (4PM - 8PM)",
      "Thursday evening (4PM - 8PM)",
    ],
    hasOther: true,
    required: true,
  },
  {
    id: "wishlist",
    title:
      "What do you wish you could buy at a local market but currently can't?",
    type: "text",
    required: false,
  },
  {
    id: "csa_interest",
    title:
      "Would you be interested in a multi-farm subscription box (CSA-style) picked up at the market?",
    type: "single-select",
    options: ["Yes", "No", "I'd need to learn more"],
    hasOther: true,
    required: true,
  },
  {
    id: "email",
    title: "What is your email address?",
    subtitle:
      "To be included in the raffle for a $100 Sendik's gift card. Your email will not be used for marketing purposes.",
    type: "email",
    required: true,
  },
];
