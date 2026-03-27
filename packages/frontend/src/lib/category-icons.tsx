import ApartmentRoundedIcon from "@mui/icons-material/ApartmentRounded";
import BoltRoundedIcon from "@mui/icons-material/BoltRounded";
import CategoryRoundedIcon from "@mui/icons-material/CategoryRounded";
import DirectionsBusRoundedIcon from "@mui/icons-material/DirectionsBusRounded";
import FastfoodRoundedIcon from "@mui/icons-material/FastfoodRounded";
import FlightTakeoffRoundedIcon from "@mui/icons-material/FlightTakeoffRounded";
import LocalHospitalRoundedIcon from "@mui/icons-material/LocalHospitalRounded";
import MenuBookRoundedIcon from "@mui/icons-material/MenuBookRounded";
import MoreHorizRoundedIcon from "@mui/icons-material/MoreHorizRounded";
import MovieRoundedIcon from "@mui/icons-material/MovieRounded";
import ShoppingBagRoundedIcon from "@mui/icons-material/ShoppingBagRounded";
import SubscriptionsRoundedIcon from "@mui/icons-material/SubscriptionsRounded";

/** MUI icon per predefined category name; custom categories fall back to {@link CategoryRoundedIcon}. */
export const categoryIconMap: Record<string, typeof FastfoodRoundedIcon> = {
  Food: FastfoodRoundedIcon,
  Transport: DirectionsBusRoundedIcon,
  Housing: ApartmentRoundedIcon,
  Utilities: BoltRoundedIcon,
  Entertainment: MovieRoundedIcon,
  Health: LocalHospitalRoundedIcon,
  Shopping: ShoppingBagRoundedIcon,
  Travel: FlightTakeoffRoundedIcon,
  Education: MenuBookRoundedIcon,
  Subscriptions: SubscriptionsRoundedIcon,
  Other: MoreHorizRoundedIcon,
};

export const getCategoryIcon = (category: string) => categoryIconMap[category] ?? CategoryRoundedIcon;
