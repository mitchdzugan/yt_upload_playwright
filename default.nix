{ pkgs, nativeBuildInputs, vars, ... }: pkgs.buildNpmPackage {
  pname = "yt-upload-pw";
  version = "1.0.0";
  src = ./.;
  npmDepsHash = "sha256-mKYJsX2V0xr61cw6TioGXDaf2ItVVs+vY9fCCODX+mg=";
  nativeBuildInputs = [ pkgs.makeWrapper ] ++ nativeBuildInputs;
  postInstall = ''
    wrapProgram "$out/bin/yt-upload-pw" \
      ${builtins.concatStringsSep " " (
        map (kv: builtins.concatStringsSep " " (["--set"] ++ kv)) vars
      )}
  '';
}
