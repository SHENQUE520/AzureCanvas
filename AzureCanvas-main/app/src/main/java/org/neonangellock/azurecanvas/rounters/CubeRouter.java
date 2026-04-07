package org.neonangellock.azurecanvas.rounters;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;


public class CubeRouter {
    @GetMapping("/cube")
    public String loadCube(){
        return "app/cube/index";
    }
}
