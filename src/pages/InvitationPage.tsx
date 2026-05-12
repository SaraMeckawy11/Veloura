import { useState } from "react";
import { useParams } from "react-router-dom";
import type { Language } from "../types";
import { weddingConfig } from "../config/weddingConfig";
import { translations } from "../config/translations";
import { invitationTheme } from "../themes/themes";
import { HeroSection } from "../components/HeroSection";
import { CountdownSection } from "../components/CountdownSection";
import { StorySection } from "../components/StorySection";
import { EventDetailsSection } from "../components/EventDetailsSection";
import { RSVPSection } from "../components/RSVPSection";
import { GallerySection } from "../components/GallerySection";
import { FooterSection } from "../components/FooterSection";
import { InvitationIntro } from "../components/InvitationIntro";

export function InvitationPage() {
  const { uuid } = useParams();
  const [isInvitationOpen, setIsInvitationOpen] = useState(false);
  const language: Language = "en";
  const theme = invitationTheme;
  const t = translations;
  const inviteUuid = uuid ?? weddingConfig.sampleUuid;

  if (!isInvitationOpen) {
    return (
      <InvitationIntro
        config={weddingConfig}
        language={language}
        openLabel={t.actions.openInvitationCover}
        onOpen={() => setIsInvitationOpen(true)}
      />
    );
  }

  return (
    <main className={theme.classes.page}>
      <HeroSection
        config={weddingConfig}
        theme={theme}
        language={language}
        labels={{ details: t.nav.details, rsvp: t.nav.rsvp }}
      />
      <CountdownSection
        config={weddingConfig}
        theme={theme}
        language={language}
        labels={{
          eyebrow: t.sections.countdownEyebrow,
          title: t.sections.countdownTitle,
          days: t.countdown.days,
          hours: t.countdown.hours,
          minutes: t.countdown.minutes,
          seconds: t.countdown.seconds
        }}
      />
      <StorySection
        config={weddingConfig}
        theme={theme}
        language={language}
        labels={{
          eyebrow: t.sections.storyEyebrow,
          title: t.sections.storyTitle
        }}
      />
      <EventDetailsSection
        config={weddingConfig}
        theme={theme}
        language={language}
        labels={{
          eyebrow: t.sections.detailsEyebrow,
          title: t.sections.detailsTitle,
          dateTime: t.details.dateTime,
          venue: t.details.venue,
          address: t.details.address,
          viewLocation: t.actions.viewLocation
        }}
      />
      <RSVPSection
        uuid={inviteUuid}
        config={weddingConfig}
        theme={theme}
        language={language}
        labels={{
          eyebrow: t.sections.rsvpEyebrow,
          title: t.sections.rsvpTitle,
          guestName: t.rsvp.guestName,
          guestNamePlaceholder: t.rsvp.guestNamePlaceholder,
          guestCount: t.rsvp.guestCount,
          attending: t.rsvp.attending,
          attendingYes: t.rsvp.attendingYes,
          attendingNo: t.rsvp.attendingNo,
          mealPreference: t.rsvp.mealPreference,
          message: t.rsvp.message,
          messagePlaceholder: t.rsvp.messagePlaceholder,
          submitRsvp: t.actions.submitRsvp,
          success: t.rsvp.success,
          required: t.rsvp.required
        }}
      />
      <GallerySection
        config={weddingConfig}
        theme={theme}
        language={language}
        labels={{
          eyebrow: t.sections.galleryEyebrow,
          title: t.sections.galleryTitle,
          close: t.actions.close
        }}
      />
      <FooterSection
        config={weddingConfig}
        theme={theme}
        language={language}
        labels={{
          thankYou: t.footer.thankYou,
          madeWith: t.footer.madeWith
        }}
      />
    </main>
  );
}
