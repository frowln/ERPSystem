package com.privod.platform.modules.bim.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum BimModelFormat {

    IFC("IFC"),
    RVT("Revit (RVT)"),
    DWG("AutoCAD (DWG)"),
    NWD("Navisworks (NWD)"),
    SKP("SketchUp (SKP)");

    private final String displayName;
}
