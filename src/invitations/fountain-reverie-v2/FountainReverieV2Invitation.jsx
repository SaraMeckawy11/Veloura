import FountainReverieInvitation from '../fountain-reverie-shared/FountainReverieInvitation';
import heroImage from '../../assets/Fountain Reverie/hero2empty.png';

export default function FountainReverieV2Invitation(props) {
  return (
    <FountainReverieInvitation
      {...props}
      heroImage={heroImage}
      variant="v2"
    />
  );
}
