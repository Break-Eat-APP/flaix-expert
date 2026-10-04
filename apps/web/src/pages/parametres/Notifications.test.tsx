/**
 * Notifications sur ce téléphone (dossier §15.135) — test de l'écran : sans prise en charge des
 * notifications (iPhone sans l'application sur l'écran d'accueil), le directeur sait quoi faire.
 */
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { Notifications } from "./Notifications.tsx";

afterEach(() => cleanup());

describe("notifications sur ce téléphone", () => {
  it("navigateur sans notifications : l'écran explique comment installer l'application sur iPhone", async () => {
    render(
      <MemoryRouter>
        <Notifications />
      </MemoryRouter>,
    );
    await screen.findByText(/Sur l'écran d'accueil/);
    expect(screen.queryByRole("button", { name: /Recevoir le brief/ })).toBeNull();
  });
});
