import { HomeHeroVisual } from "./HomeHeroVisual";
import { HomeRestaurants } from "./HomeRestaurants";
import { HomeDishes } from "./HomeDishes";
import { HomeHowItWorks } from "./HomeHowItWorks";
import { HomeWhyUs } from "./HomeWhyUs";
import { HomeStatsCta } from "./HomeStatsCta";


export function HomeContent() {
  return (
    <>
      <HomeHeroVisual />
      <HomeRestaurants />
      <HomeDishes />
      <HomeHowItWorks />
      <HomeWhyUs />
      <HomeStatsCta />
    </>
  );
}
