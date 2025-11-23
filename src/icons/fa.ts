import { library } from '@fortawesome/fontawesome-svg-core';
import { faTwitter, faLinkedin, faSpotify } from '@fortawesome/free-brands-svg-icons';
import { faDotCircle } from '@fortawesome/free-regular-svg-icons';
import {
  faChevronDown,
  faCircle as fasCircle,
  faVolumeHigh,
  faBell,
  faQuestionCircle,
  faPlusCircle,
  faCog,
  faComments,
  faSpinner,
} from '@fortawesome/free-solid-svg-icons';

// Register commonly used icons for tree-shaken usage
library.add(
  faChevronDown,
  fasCircle,
  faVolumeHigh,
  faDotCircle,
  faTwitter,
  faLinkedin,
  faSpotify,
  faBell,
  faQuestionCircle,
  faPlusCircle,
  faCog,
  faComments,
  faSpinner,
);


