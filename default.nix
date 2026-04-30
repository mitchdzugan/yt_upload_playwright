{ pkgs, nativeBuildInputs, vars, ... }: pkgs.buildNpmPackage {
  pname = "yt-upload-playwright";
  version = "1.0.0";
  src = ./.;
  npmDepsHash = "sha256-Z3HXv6c2JFntrjeGgZRaDBvh0fsi4QKLbKjzwHfDJyQ=";
  nativeBuildInputs = [ pkgs.makeWrapper ] ++ nativeBuildInputs;
  postInstall = ''
    wrapProgram "$out/bin/yt-upload-playwright" \
      ${builtins.concatStringsSep " " (
        map (kv: builtins.concatStringsSep " " (["--set"] ++ kv)) vars
      )}
  '';
}
