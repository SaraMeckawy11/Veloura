import FountainReverieInvitation from '../fountain-reverie-shared/FountainReverieInvitation';
import heroImage from '../../assets/Fountain Reverie/hero1empty.png';

export default function FountainReverieV1Invitation(props) {
  return (
    <FountainReverieInvitation
      {...props}
      heroImage={heroImage}
      variant="v1"
    />
  );
}
