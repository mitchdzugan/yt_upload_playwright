{ pkgs, nativeBuildInputs, vars, ... }: pkgs.buildNpmPackage {
  pname = "yt-upload-playwright";
  version = "1.0.0";
  src = ./.;
  npmDepsHash = "sha256-rMSO22zJN80nKPy6LlWh3SUAFyfzpJ393sZ2cwzF1UY=";
  nativeBuildInputs = [ pkgs.makeWrapper ] ++ nativeBuildInputs;
  propagatedBuildInputs = nativeBuildInputs;
  postInstall = ''
    wrapProgram "$out/bin/yt-upload-playwright" \
      ${builtins.concatStringsSep " " (
        map (kv: builtins.concatStringsSep " " (["--set"] ++ kv)) vars
      )}
  '';
}
