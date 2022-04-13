package com.azesmwayreactnativeunity;

import android.os.Handler;
import android.util.Log;
import android.view.View;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.facebook.infer.annotation.Assertions;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.LifecycleEventListener;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.common.MapBuilder;
import com.facebook.react.uimanager.SimpleViewManager;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.ViewGroupManager;
import com.facebook.react.uimanager.events.RCTEventEmitter;
import com.unity3d.player.UnityPlayer;

import java.util.Map;

import javax.annotation.Nonnull;

public class ReactNativeUnityViewManager extends SimpleViewManager<ReactNativeUnityView> implements LifecycleEventListener, View.OnAttachStateChangeListener {
    public static final String REACT_CLASS = "ReactNativeUnityView";
    ReactApplicationContext context;
    static ReactNativeUnityView view;

    public ReactNativeUnityViewManager(ReactApplicationContext context) {
        super();
        this.context = context;
        context.addLifecycleEventListener(this);
    }
    @Override
    @NonNull
    public String getName() {
        return REACT_CLASS;
    }

    @Override
    @NonNull
    protected ReactNativeUnityView createViewInstance(@Nonnull ThemedReactContext reactContext) {
        view = new ReactNativeUnityView(reactContext);
        view.addOnAttachStateChangeListener(this);

        if (ReactNativeUnity.getPlayer() != null) {
            view.setUnityPlayer(ReactNativeUnity.getPlayer());
        } else {
            ReactNativeUnity.createPlayer(reactContext.getCurrentActivity(), new ReactNativeUnity.CreateCallback() {
                @Override
                public void onReady() {
                    view.setUnityPlayer(ReactNativeUnity.getPlayer());
                }
            });
        }

        return view;
    }

    public Map getExportedCustomBubblingEventTypeConstants() {
        return MapBuilder.builder()
                .put("onUnityMessage", MapBuilder.of("phasedRegistrationNames", MapBuilder.of("bubbled", "onUnityMessage")))
                .build();
    }

    @Override
    public void receiveCommand(
            @NonNull ReactNativeUnityView view,
            String commandType,
            @Nullable ReadableArray args) {
        Assertions.assertNotNull(view);
        Assertions.assertNotNull(args);
        switch (commandType) {
            case "postMessage":
                assert args != null;
                postMessage(args.getString(0), args.getString(1), args.getString(2));
                return;
            case "unloadUnity":
                unloadUnity(view);
                return;
            default:
                throw new IllegalArgumentException(String.format(
                        "Unsupported command %s received by %s.",
                        commandType,
                        getClass().getSimpleName()));
        }
    }

    public void unloadUnity(ReactNativeUnityView view) {
        if (ReactNativeUnity.isUnityReady()) {
            ReactNativeUnity.unload();
        }
    }

    public void postMessage(String gameObject, String methodName, String message) {
        if (ReactNativeUnity.isUnityReady()) {
            UnityPlayer.UnitySendMessage(gameObject, methodName, message);
        }
    }

    public static void sendMessageToMobileApp(String message) {
        WritableMap data = Arguments.createMap();
        data.putString("message", message);
        ReactContext reactContext = (ReactContext) view.getContext();
        reactContext.getJSModule(RCTEventEmitter.class).receiveEvent(view.getId(), "onUnityMessage", data);
    }

    @Override
    public void onDropViewInstance(ReactNativeUnityView view) {
        view.removeOnAttachStateChangeListener(this);
        super.onDropViewInstance(view);
    }

    @Override
    public void onHostResume() {
        if (ReactNativeUnity.isUnityReady()) {
            ReactNativeUnity.getPlayer().resume();
            restoreUnityUserState();
        }
    }

    @Override
    public void onHostPause() {
        if (ReactNativeUnity.isUnityReady()) {
            // Don't use UnityUtils.pause()
            ReactNativeUnity.getPlayer().pause();
        }
    }

    @Override
    public void onHostDestroy() {
        if (ReactNativeUnity.isUnityReady()) {
            ReactNativeUnity.getPlayer().quit();
        }
    }

    private void restoreUnityUserState() {
        // restore the unity player state
        if (ReactNativeUnity.isUnityPaused()) {
            Handler handler = new Handler();
            handler.postDelayed(new Runnable() {
                @Override
                public void run() {
                    if (ReactNativeUnity.getPlayer() != null) {
                        ReactNativeUnity.getPlayer().pause();
                    }
                }
            }, 300);
        }
    }

    @Override
    public void onViewAttachedToWindow(View v) {
        restoreUnityUserState();
    }

    @Override
    public void onViewDetachedFromWindow(View v) {

    }
}
