{ pkgs, nativeBuildInputs, vars, ... }: pkgs.buildNpmPackage {
  pname = "yt-upload-playwright";
  version = "1.0.0";
  src = ./.;
  npmDepsHash = "sha256-h20S4ADq7MBnzynoSAi4CMrgyqroZxWhdkZjECIid14=";
  nativeBuildInputs = [ pkgs.makeWrapper ] ++ nativeBuildInputs;
  postInstall = ''
    wrapProgram "$out/bin/yt-upload-playwright" \
      ${builtins.concatStringsSep " " (
        map (kv: builtins.concatStringsSep " " (["--set"] ++ kv)) vars
      )}
  '';
}
