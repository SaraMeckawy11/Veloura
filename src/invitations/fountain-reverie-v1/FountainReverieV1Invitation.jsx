import FountainReverieInvitation from '../fountain-reverie-shared/FountainReverieInvitation';
import heroImage from '../../assets/Fountain Reverie/hero1empty.png';
import heroVideo from '../../assets/Fountain Reverie/Create_a_portrait_video_using.mp4';

export default function FountainReverieV1Invitation(props) {
  return (
    <FountainReverieInvitation
      {...props}
      heroImage={heroImage}
      heroVideo={heroVideo}
      variant="v1"
    />
  );
}
