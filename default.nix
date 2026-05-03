{ pkgs, nativeBuildInputs, vars, ... }: pkgs.buildNpmPackage {
  pname = "yt-upload-playwright";
  version = "1.0.0";
  src = ./.;
  npmDepsHash = "sha256-pUypczq5Di1Tue00qC1tgqmXlehvyR89wl0FUXwvGKY=";
  nativeBuildInputs = [ pkgs.makeWrapper ] ++ nativeBuildInputs;
  postInstall = ''
    wrapProgram "$out/bin/yt-upload-playwright" \
      ${builtins.concatStringsSep " " (
        map (kv: builtins.concatStringsSep " " (["--set"] ++ kv)) vars
      )}
  '';
}
