import './fountain-reverie.css';
import monogramFrame from '../../assets/Fountain Reverie/fountain_separator_components/monogram_frame.png';
import leafAmpersand from '../../assets/Fountain Reverie/fountain_separator_components/leaf_ampersand.png';
import dividerTop from '../../assets/Fountain Reverie/fountain_separator_components/divider_top.png';
import dividerMiddle from '../../assets/Fountain Reverie/fountain_separator_components/divider_middle.png';
import calendarIcon from '../../assets/Fountain Reverie/fountain_separator_components/calendar_icon.png';
import clockIcon from '../../assets/Fountain Reverie/fountain_separator_components/clock_icon.png';
import locationIcon from '../../assets/Fountain Reverie/fountain_separator_components/location_icon.png';
import verticalSeparator from '../../assets/Fountain Reverie/fountain_separator_components/vertical_separat.png';
import { formatInvitationName } from '../shared';

function Monogram({ firstInitial = 'A', secondInitial = 'Z' }) {
  return (
    <div className="fountain-mono">
      <img className="fountain-mono__frame" src={monogramFrame} alt="" aria-hidden="true" />
      <div className="fountain-mono__letters">
        <span>{firstInitial}</span>
        <i className="fountain-mono__bar" aria-hidden="true" />
        <span>{secondInitial}</span>
      </div>
    </div>
  );
}

function FamilyLine({ text = 'TOGETHER WITH THEIR FAMILIES' }) {
  return <p className="fountain-fam">{text}</p>;
}

function Rule({ variant = 'middle' }) {
  return (
    <img
      className="fountain-rule"
      src={variant === 'top' ? dividerTop : dividerMiddle}
      alt=""
      aria-hidden="true"
    />
  );
}

function CoupleNames({ bride = 'Aaliyah', groom = 'Zayn' }) {
  return (
    <div className="fountain-couple">
      <h1>{formatInvitationName(bride)}</h1>
      <img className="fountain-couple__amp" src={leafAmpersand} alt="and" />
      <h1>{formatInvitationName(groom)}</h1>
    </div>
  );
}

function InviteText({
  line1 = 'INVITE YOU TO CELEBRATE',
  line2 = 'THEIR WEDDING',
}) {
  return (
    <div className="fountain-invite">
      <p>{line1}</p>
      <p>{line2}</p>
    </div>
  );
}

function DetailItem({ icon, title, lines = [] }) {
  return (
    <div className="fountain-info__item">
      <img className="fountain-info__icon" src={icon} alt="" aria-hidden="true" />
      <p className="fountain-info__title">{title}</p>

      {lines.map((line) => (
        <p className="fountain-info__line" key={line}>
          {line}
        </p>
      ))}
    </div>
  );
}

function Separator() {
  return <img className="fountain-info__sep" src={verticalSeparator} alt="" aria-hidden="true" />;
}

function WeddingDetails({
  date = '24 MAY 2025',
  day = 'SATURDAY',
  time = 'AT 5:30 PM',
  timeNote = 'IN THE EVENING',
  venue = 'THE GARDEN PAVILION',
  address1 = '',
  address2 = '',
}) {
  return (
    <div className="fountain-info">
      <DetailItem icon={calendarIcon} title={day} lines={[date].filter(Boolean)} />
      <Separator />
      <DetailItem icon={clockIcon} title={time} lines={[timeNote].filter(Boolean)} />
      <Separator />
      <DetailItem icon={locationIcon} title={venue} lines={[address1, address2].filter(Boolean)} />
    </div>
  );
}

export default function FountainHeroText({
  firstInitial = 'A',
  secondInitial = 'Z',
  bride = 'Aaliyah',
  groom = 'Zayn',
  familyText = 'TOGETHER WITH THEIR FAMILIES',
  inviteLine1 = 'INVITE YOU TO CELEBRATE',
  inviteLine2 = 'THEIR WEDDING',
  day = 'SATURDAY',
  date = '24 MAY 2025',
  time = 'AT 5:30 PM',
  timeNote = 'IN THE EVENING',
  venue = 'THE GARDEN PAVILION',
  address1 = '',
  address2 = '',
}) {
  return (
    <div className="fountain-hero-text">
      <Monogram firstInitial={firstInitial} secondInitial={secondInitial} />

      <FamilyLine text={familyText} />
      <Rule variant="top" />

      <CoupleNames bride={bride} groom={groom} />

      <InviteText line1={inviteLine1} line2={inviteLine2} />
      <Rule variant="middle" />

      <WeddingDetails
        day={day}
        date={date}
        time={time}
        timeNote={timeNote}
        venue={venue}
        address1={address1}
        address2={address2}
      />
    </div>
  );
}
