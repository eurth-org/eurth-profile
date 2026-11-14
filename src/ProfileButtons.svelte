<!--
  The two buttons every Eurth tool shows for the profile file: "Load profile"
  and "Save profile". With `drop` on (the default), a profile file can also be
  dropped anywhere on the window.

  The look comes from the suite's stylesheet (the `eu-btn` class), so there
  are no colours, fonts or sizes here. Nothing is stored and nothing is sent:
  loading reads a file the person picks, and saving downloads one.
-->
<script lang="ts">
  import type { EurthProfile, ProfileError } from '@eurth/profile';
  import { downloadProfile, pickProfile, profileDrop } from './dom.js';

  let {
    profile,
    onload,
    onerror,
    drop = true
  }: {
    /** The profile to save. Without one, "Save profile" is switched off. */
    profile: EurthProfile | null;
    /** Called with a profile that was loaded or dropped, already checked. */
    onload: (profile: EurthProfile) => void;
    /** Called with the problems when a file cannot be used, or a profile cannot be saved. */
    onerror: (errors: ProfileError[]) => void;
    /** Whether a profile file may be dropped anywhere on the window. */
    drop?: boolean;
  } = $props();

  async function load() {
    const result = await pickProfile();
    if (!result) return;
    if (result.ok) onload(result.profile);
    else onerror(result.errors);
  }

  function save() {
    if (!profile) return;
    const result = downloadProfile(profile);
    if (!result.ok) onerror(result.errors);
  }

  $effect(() => {
    if (!drop) return;
    return profileDrop(window, {
      onprofile: (loaded) => onload(loaded),
      onerror: (errors) => onerror(errors)
    });
  });
</script>

<button type="button" class="eu-btn" onclick={load}>Load profile</button>
<button type="button" class="eu-btn" onclick={save} disabled={!profile}>Save profile</button>
