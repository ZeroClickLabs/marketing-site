import type { Metadata } from "next";
import SurveyForm from "./SurveyForm";

export const metadata: Metadata = {
  title: "North Shore Farmers Market Survey",
  description:
    "Share your thoughts on local farmers markets and enter to win a $100 Sendik's gift card!",
  openGraph: {
    title: "North Shore Farmers Market Survey",
    description:
      "Share your thoughts on local farmers markets and enter to win a $100 Sendik's gift card!",
    type: "website",
  },
};

export default function FarmersMarketSurveyPage() {
  return <SurveyForm />;
}
