/**
 * FV-717: source-text guards on the NATIVE half of the build marker.
 *
 * apps/native is not compiled or run in CI, so these pin the wiring that
 * would otherwise fail silently: a shell that stops reporting its build is
 * indistinguishable from an old one, and would be gated the day a minimum is
 * set. Read as text for the same reason capacitor-config.test.ts does.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const read = (rel: string) => readFileSync(resolve(__dirname, "../../native", rel), "utf8");

describe("native build marker wiring (FV-717)", () => {
  const gradle = read("android/app/build.gradle");
  const swift = read("ios/App/App/FVBridgeViewController.swift");
  const capacitorConfig = read("capacitor.config.ts");
  const gate = readFileSync(resolve(__dirname, "../lib/native-build-gate.ts"), "utf8");

  it("Android stamps the marker from the packaged versionCode, before assets are merged", () => {
    expect(gradle).toContain("tasks.register('stampNativeBuildMarker')");
    expect(gradle).toContain("def fvBuildNumber = android.defaultConfig.versionCode");
    expect(gradle).toContain('"FVBuild/${buildNumber}"');
    expect(gradle).toMatch(
      /tasks\.matching \{ it\.name ==~ \/merge\.\*Assets\/ \}\.configureEach \{ dependsOn tasks\.named\('stampNativeBuildMarker'\) \}/,
    );
  });

  it("Android stamping replaces an existing marker and refuses a UA that lost the shell token", () => {
    expect(gradle).toContain("findAll { !(it ==~ /FVBuild\\/\\d+/) }");
    expect(gradle).toContain("tokens[0] != 'FVNativeShell/1'");
  });

  it("the Play Billing guard still runs, after stamping", () => {
    expect(gradle).toContain(
      "tasks.named('verifyPlayBillingSwitch') { mustRunAfter tasks.named('stampNativeBuildMarker') }",
    );
    expect(gradle).toMatch(/dependsOn tasks\.named\('verifyPlayBillingSwitch'\)/);
  });

  it("iOS appends the marker at runtime from CFBundleVersion, after Capacitor's own tokens", () => {
    expect(swift).toContain(
      "override open func webViewConfiguration(for instanceConfiguration: InstanceConfiguration) -> WKWebViewConfiguration",
    );
    expect(swift).toContain("super.webViewConfiguration(for: instanceConfiguration)");
    expect(swift).toContain('forInfoDictionaryKey: "CFBundleVersion"');
    expect(swift).toContain('"FVBuild/\\(number)"');
    expect(swift).toContain('"\\(existing) \\(marker)"');
  });

  it("the marker is never written into capacitor.config.ts (its tokens stay pinned)", () => {
    expect(capacitorConfig).not.toContain("FVBuild");
  });

  it("the server parses the same token name the shells send", () => {
    expect(gate).toContain("FVBuild\\/(\\d{1,9})");
  });
});
