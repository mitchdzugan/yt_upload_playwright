{ pkgs, nativeBuildInputs, vars, ... }: pkgs.buildNpmPackage {
  pname = "yt-upload-playwright";
  version = "1.0.0";
  src = ./.;
  npmDepsHash = "sha256-jqdplulT9wd5qkC9Z6x9TLA/YTlNaSukvm5pmBVfVsw=";
  nativeBuildInputs = [ pkgs.makeWrapper ] ++ nativeBuildInputs;
  propagatedBuildInputs = nativeBuildInputs;
  postInstall = ''
    wrapProgram "$out/bin/yt-upload-playwright" \
      ${builtins.concatStringsSep " " (
        map (kv: builtins.concatStringsSep " " (["--set"] ++ kv)) vars
      )}
  '';
}
