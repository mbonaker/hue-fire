This addon adds a color picker to the extension icon bar. However while most color pickers work with the <acronym title="Hue Saturation Lightness">HSL</acronym> color space, this one works with the <acronym title="Hue Chroma Luminosity">HCL</acronym> (or <acronym title="Luminosity Chroma Hue">LCH</acronym>) color space.

<b>Why is this color picker so different?</b>

TL;DR: This color picker is based around how colors are <i>perceived</i>, not how they are <i>emitted</i>.

In this color picker you can select the <i>perceived</i> luminosity of a color, the <i>perceived</i> chroma and the <i>perceived</i> hue. In other words, this is an HCL color picker.

For contrast: Most color pickers let you  pick a color by its hue, saturation and lightness. In those kinds of color pickers the lightness scales linearly with the physical lightness that the screen presumably (not necessarily acurately) emits. However, if you try to read white text on <code>hsl(120, 100%, 50%)</code> a.k.a. <code>#00ff00</code> a.k.a. "intense green", you will barely be able to do so, if at all. White text on <code>hsl(240, 100%, 50%)</code> a.k.a. <code>#0000ff</code> a.k.a. "intense blue" is very natural and can be read without any problems even though the green and the blue have the same "lightness" values. In HCL on the other hand <code>#00ff00</code> is represented as <code>hcl(136, 120, 88)</code> and <code>#0000ff</code> is represented as <code>hcl(306, 134, 32)</code>. The difference in "luminosity" is 88 to 32 which matches the difference in perception.

<b>Functions</b>

<ul>
 <li>View and select colors on the C/L plane, the H/L plane or the H/C plane</li>
 <li>View and select colors on the H, C and L bars</li>
 <li>View and select colors on the gradient of any arbitrary two colors with equal spacing (by adding more dots via the "+" next to the gradient tool)
 <ul>
  <li>To set a color as the start of the gradient you have to first add it to the palette and then click on it and select the according option</li>
 </ul>
</li>
 <li>Switch the "reference" color by Alt+Left Mouse Button on a plane or bar</li>
 <li>Save a color set by inputting the name of it into the "Name or JSON" field and clicking the "+" next to it.</li>
 <li>Load a color set by clicking on it in the list of sets and then clicking "load"</li>
 <li>Copy a full color set to clipboard as JSON by clicking on the set in the lower most bar and selecting "Copy as JSON".</li>
 <li>Paste a full color set from clipboard by pasting it into the "Name or JSON" field on the lower right and pressing the "+" button.</li>
 <li>Display complementary colors by using the "incl. compl." checkboxes right above the color planes.</li>
</ul>