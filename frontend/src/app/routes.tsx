import { createBrowserRouter } from "react-router";
import { Root } from "./components/Root";
import { LandingPage } from "./components/LandingPage";
import { LoginPage } from "./components/LoginPage";
import { SignupPage } from "./components/SignupPage";
import { Dashboard } from "./components/Dashboard";
import { ModelsPage } from "./components/ModelsPage";
import { DatasetsPage } from "./components/DatasetsPage";
import { DatasetPage } from "./components/DatasetPage";
import { LearningPage } from "./components/LearningPage";
import { ProfilePage } from "./components/ProfilePage";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      { index: true, Component: LandingPage },
      { path: "login", Component: LoginPage },
      { path: "signup", Component: SignupPage },
      { path: "dashboard", Component: Dashboard },
      { path: "models", Component: ModelsPage },
      { path: "datasets", Component: DatasetsPage },
      { path: "datasets/:publicUsername/:datasetSlug", Component: DatasetPage },
      { path: "learning", Component: LearningPage },
      { path: "profile", Component: ProfilePage },
    ],
  },
]);
