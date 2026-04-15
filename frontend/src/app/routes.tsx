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
import { PasswordResetRequestPage } from "./components/PasswordResetRequestPage";
import { PasswordResetConfirmPage } from "./components/PasswordResetConfirmPage";
import { ErrorPage } from "./components/ErrorPage";
import { RequireAuth } from "./components/RequireAuth";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    errorElement: <ErrorPage />,
    children: [
      { index: true, Component: LandingPage },
      { path: "login", Component: LoginPage },
      { path: "signup", Component: SignupPage },
      { path: "password-reset", Component: PasswordResetRequestPage },
      { path: "password-reset/confirm/:uid/:token", Component: PasswordResetConfirmPage },
      { path: "datasets/:publicUsername/:datasetSlug", Component: DatasetPage },
      {
        Component: RequireAuth,
        children: [
          { path: "dashboard", Component: Dashboard },
          { path: "models", Component: ModelsPage },
          { path: "datasets", Component: DatasetsPage },
          { path: "learning", Component: LearningPage },
          { path: "profile", Component: ProfilePage },
        ],
      },
      { path: "*", Component: ErrorPage },
    ],
  },
]);
