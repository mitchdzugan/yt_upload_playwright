{
  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-unstable";
  };

  outputs = { self, nixpkgs }:
    let
      system = "x86_64-linux";
      pkgs = nixpkgs.legacyPackages.${system};
      pwdp = "${pkgs.playwright-driver.browsers}";
    in {
      devShells.${system}.default = pkgs.mkShell {
        nativeBuildInputs = [
          pkgs.playwright
          pkgs.playwright-driver.browsers
          pkgs.nodePackages.nodejs
          pkgs.nodePackages.npm
        ];
        shellHook = ''
          ls "${pwdp}"
          export PLAYWRIGHT_BROWSERS_PATH=${pwdp}
          export PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS=true
          export PLAYWRIGHT_HOST_PLATFORM_OVERRIDE="ubuntu-24.04"
        '';
      };
    };
}
